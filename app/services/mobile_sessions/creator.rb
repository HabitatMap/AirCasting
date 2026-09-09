module MobileSessions
  class Creator
    UnknownStreamTypeError = Class.new(StandardError)
    MissingThresholdsError = Class.new(StandardError)
    # Retyped at the raise site so the rescue chain can tell a stream conflict (a
    # request problem) from a uuid or device one, without reading PG message text.
    DuplicateStreamError = Class.new(StandardError)

    # 1..99 are reserved for built-in sensors, whose ids firmware is configured
    # with. Custom sensors get one per session out of the rest of the uint8 field.
    CUSTOM_SENSOR_TYPE_ID_RANGE = (100..255).freeze

    UUID_TAKEN_MESSAGE = 'A session with this uuid already exists'.freeze

    # Bounds the wait on a rival's uncommitted index entry; nothing else does.
    LOCK_TIMEOUT = '3s'.freeze

    def call(data:, user:)
      # Insert and let the unique index on LOWER(uuid) refuse us, rather than
      # asking first — the answer to "is this uuid free?" is stale by the time it
      # is given. A sequential retry never gets this far: the model's uniqueness
      # validation catches it and answers session_uuid_taken.
      begin
        # requires_new: without a SAVEPOINT the violation poisons a caller's
        # transaction, and reusable_session's SELECT raises instead of returning
        # the winner's row.
        ActiveRecord::Base.transaction(requires_new: true) do
          # SET LOCAL is transaction-scoped, not savepoint-scoped, so setting it
          # inside a caller's transaction leaves them a lock_timeout they never
          # asked for. open_transactions == 1 identifies the outermost one;
          # transaction_open? is true either way, since it sees our own.
          if ActiveRecord::Base.connection.open_transactions == 1
            ActiveRecord::Base.connection.execute("SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'")
          end

          device = find_or_create_device(data[:device], user)
          session = create_session(data, user, device)
          streams = create_streams(data, session)
          Success.new(session: session, streams: streams)
        end
      rescue ActiveRecord::RecordNotUnique
        existing = reusable_session(data, user) or raise

        # Lost the race. The winner's stream mapping matters most: a custom
        # sensor's sensor_type_id is per-session and the phone addresses its binary
        # uploads by it, so our own rolled-back ids would point nowhere.
        Success.new(
          session: existing,
          # Unordered on purpose — the app resolves streams by sensor name.
          streams: existing.streams.map do |stream|
            { sensor_name: stream.sensor_name, sensor_type_id: stream.sensor_type_id }
          end,
        )
      end
    rescue ActiveRecord::LockWaitTimeout
      Failure.new(
        error_code: ErrorCodes::INTERNAL_ERROR,
        message: 'Could not create this session, please retry',
      )
    rescue MissingThresholdsError => e
      Failure.new(error_code: ErrorCodes::VALIDATION_ERROR, message: e.message)
    rescue UnknownStreamTypeError => e
      Failure.new(error_code: ErrorCodes::UNSUPPORTED_SENSOR_TYPE, message: e.message)
    rescue DuplicateStreamError
      Failure.new(
        error_code: ErrorCodes::VALIDATION_ERROR,
        message: 'Request conflicts with an existing record',
      )
    # Re-raised from above when the conflict was not a session we may reuse —
    # usually index_devices_on_user_id_and_mac_address, which find_or_create_device
    # races. Do not narrow this to the uuid constraint. The message is replaced
    # because a PG::UniqueViolation names the constraint and quotes the conflicting
    # values, and errors render straight to the client.
    rescue ActiveRecord::RecordNotUnique => e
      Rails.logger.warn("[MobileSessions::Creator] #{e.class}: #{e.message}")
      Failure.new(
        error_code: ErrorCodes::INTERNAL_ERROR,
        message: 'Could not create this session',
      )
    rescue ActiveRecord::RecordInvalid => e
      # The uuid committed before this request started. Not user-scoped: the
      # model's uniqueness validation is global, so another user's uuid lands here.
      return uuid_taken if uuid_taken_error?(e)

      Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
    rescue ActiveRecord::RecordNotFound => e
      Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
    end

    private

    # Only a row this endpoint could have produced, for the device this request
    # names. A mobile session has no session_token, so the marker is that its
    # streams carry sensor_type_id — SessionBuilder, which owns every legacy row in
    # the same uuid space, leaves it NULL. Returning another phone's row would put
    # two devices on one session's streams with no error anywhere.
    #
    # No payload comparison, unlike SessionBuilder's same_recording: create is
    # configuration only, so the times are NULL and cannot tell two payloads apart,
    # and uuid, endpoint and device are already pinned below. Title, tags and
    # coordinates would be the winner's — wrong label, not lost data.
    def reusable_session(data, user)
      # LOWER(): the validation and the index that refused us are case-insensitive.
      session =
        user.sessions
            .where('LOWER(sessions.uuid) = ?', data[:uuid].to_s.downcase)
            .where(type: 'MobileSession')
            .first

      return nil if session.nil?

      streams = session.streams.to_a # also memoised for the response

      reusable =
        streams.any? &&
        streams.all? { |stream| stream.sensor_type_id.present? } &&
        session.device&.mac_address ==
          Device.normalize_mac_address(data.dig(:device, :mac_address))

      reusable ? session : nil
    end

    def uuid_taken_error?(error)
      error.record.is_a?(Session) && error.record.errors.of_kind?(:uuid, :taken)
    end

    def uuid_taken
      Failure.new(error_code: ErrorCodes::SESSION_UUID_TAKEN, message: UUID_TAKEN_MESSAGE)
    end

    def find_or_create_device(device_params, user)
      # Scoped to the caller: a mac_address identifies a device only within one
      # user's account (see Device).
      device =
        user.devices.find_or_initialize_by(
          mac_address: Device.normalize_mac_address(device_params[:mac_address]),
        )
      device.model = device_params[:model]
      device.name = device_params[:name] if device_params.key?(:name)
      device.save!
      device
    end

    def create_session(data, user, device)
      # Configuration only: start/end stay NULL until the measurements endpoint
      # derives them from the first upload's bounds. A session without times is
      # skipped by every map / search query and is visible only to its owner.
      MobileSession.create!(
        uuid: data[:uuid],
        title: data[:title],
        latitude: data[:latitude],
        longitude: data[:longitude],
        user: user,
        device: device,
        time_zone: data[:time_zone],
        tag_list: SessionBuilder.normalize_tags(data[:tag_list]),
        contribute: data[:contribute],
        # Mobile sessions are always outdoor; the old API took this from the
        # client payload, which sent false (or nothing) for mobile.
        is_indoor: false,
      )
    end

    def create_streams(data, session)
      streams_repository = StreamsRepository.new
      next_custom_type_id = CUSTOM_SENSOR_TYPE_ID_RANGE.first

      data[:streams].map do |stream_params|
        sensor_name = stream_params[:sensor_name].strip
        canonical = Sensor.canonical_sensor_name(sensor_name)
        type_id = Sensor::CANONICAL_SENSOR_TYPE_IDS[canonical]

        if type_id.nil?
          # Unique within this session only; the phone reads it back and uses it
          # in its binary uploads. See CUSTOM_SENSOR_TYPE_ID_RANGE.
          type_id = next_custom_type_id
          unless CUSTOM_SENSOR_TYPE_ID_RANGE.cover?(type_id)
            raise UnknownStreamTypeError, "too many custom sensors in one session (max #{CUSTOM_SENSOR_TYPE_ID_RANGE.size})"
          end

          next_custom_type_id += 1
        end

        unit_symbol = stream_params[:unit_symbol].strip
        threshold_set = resolve_threshold_set(canonical, unit_symbol, stream_params[:thresholds])

        stream = streams_repository.create!(
          params: {
            session: session,
            sensor_name: sensor_name,
            sensor_package_name: stream_package_name(session.device),
            unit_name: metadata(stream_params, canonical, :unit_name, Sensor::CANONICAL_UNIT_NAMES),
            unit_symbol: unit_symbol,
            measurement_type: metadata(stream_params, canonical, :measurement_type, Sensor::CANONICAL_MEASUREMENT_TYPES),
            measurement_short_type: metadata(
              stream_params, canonical, :measurement_short_type, Sensor::CANONICAL_MEASUREMENT_SHORT_TYPES
            ),
            threshold_set: threshold_set,
            sensor_type_id: type_id,
            min_latitude: data[:latitude],
            max_latitude: data[:latitude],
            min_longitude: data[:longitude],
            max_longitude: data[:longitude],
          },
        )

        {
          sensor_name: stream.sensor_name,
          sensor_type_id: stream.sensor_type_id,
        }
      end
    rescue ActiveRecord::RecordNotUnique
      # idx_streams_session_sensor_type_id is the only unique constraint reachable
      # here, and the contract rejects a repeated sensor type before this.
      raise DuplicateStreamError
    end

    # Known sensors are described by the server; custom ones by the client, which
    # is the only party that knows what the hardware measures.
    def metadata(stream_params, canonical, field, canonical_values)
      canonical_values[canonical] || stream_params[field].to_s.strip.presence
    end

    # `<Model>:<mac>`, the shape every legacy row uses. The mac is lowercased
    # here — `devices.mac_address` keeps its upper-case form, but the
    # `Sessions::IndexInteractor` package-name filter lowercases everything after
    # the first separator. Falls back to the column default with no device.
    def stream_package_name(device)
      return 'Builtin' unless device

      "#{device.model}:#{device.mac_address.downcase}"
    end

    # Threshold resolution, in order:
    #   1. values sent by the client — reused if an identical set already exists,
    #      which also matches the default row when the client sends default values
    #      (the lookup ignores `is_default`, exactly as the legacy upload did);
    #   2. the seeded default set for the sensor;
    #   3. neither — a client error, not a server fault.
    def resolve_threshold_set(canonical, unit_symbol, values)
      if values.present?
        return ThresholdSet.find_or_create_by!(
          sensor_name: canonical,
          unit_symbol: unit_symbol,
          threshold_very_low: values[:very_low],
          threshold_low: values[:low],
          threshold_medium: values[:medium],
          threshold_high: values[:high],
          threshold_very_high: values[:very_high],
        )
      end

      default = ThresholdSet.find_by(sensor_name: canonical, unit_symbol: unit_symbol, is_default: true)
      return default if default

      raise MissingThresholdsError,
            "no default thresholds exist for #{canonical} (#{unit_symbol}) — send `thresholds` for this stream"
    end
  end
end
