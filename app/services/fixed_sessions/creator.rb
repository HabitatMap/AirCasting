module FixedSessions
  class Creator
    UnknownStreamTypeError = Class.new(StandardError)
    # A stream conflict is a request problem; a uuid or device conflict is not.
    # Both surface as RecordNotUnique, so this one is retyped at the raise site to
    # keep the method-level rescue below from having to read PG message text.
    DuplicateStreamError = Class.new(StandardError)

    UUID_TAKEN_MESSAGE = 'A session with this uuid already exists'.freeze

    # How long to wait for a rival's in-flight insert of this uuid before failing.
    LOCK_TIMEOUT = '3s'.freeze

    def call(data:, user:)
      # The unique index on LOWER(uuid) makes a duplicate impossible; this decides
      # what the losing request is told. Insert first and let the constraint refuse
      # us, rather than asking whether the uuid is free — the answer to that
      # question is stale the moment it is given.
      #
      # A sequential retry never reaches the constraint: the model's uniqueness
      # validation rejects it first and answers session_uuid_taken. Only a request
      # whose rival had not yet committed gets here.
      begin
        # requires_new so the recovery below still works if a caller ever wraps this
        # in its own transaction; SET LOCAL lock_timeout bounds the wait on a
        # rival's uncommitted index entry, which nothing else bounds.
        ActiveRecord::Base.transaction(requires_new: true) do
          # SET LOCAL is scoped to the transaction, not the savepoint: a released
          # savepoint leaves it in force for the rest of a caller's transaction,
          # which would hand them a 3s lock_timeout they never asked for. Only the
          # outermost transaction is ours to bound — open_transactions is 1 then,
          # and 2+ when a caller wraps us (transaction_open? is true either way,
          # since it sees our own).
          if ActiveRecord::Base.connection.open_transactions == 1
            ActiveRecord::Base.connection.execute("SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'")
          end

          device = find_or_create_device(data[:airbeam], user)
          session = create_session(data, user, device)
          streams = create_streams(data, session)
          Success.new(session: session, session_token: session.session_token, streams: streams)
        end
      rescue ActiveRecord::RecordNotUnique
        existing = reusable_session(data, user) or raise

        # Lost a race with a concurrent create of this uuid. Answer with the
        # winner's row, and with the winner's session_token above all: the token is
        # flashed into the AirBeam over BLE and is how it authenticates every
        # upload, so handing out a second one would leave the device reporting
        # against a session nobody reads.
        Success.new(
          session: existing,
          session_token: existing.session_token,
          # Unordered on purpose: both apps resolve a stream by sensor name, never
          # by position, and create_streams follows the payload's order rather than
          # any sort. Do not "fix" this into an ordered scope.
          streams: existing.streams.map do |stream|
            { sensor_name: stream.sensor_name, sensor_type_id: stream.sensor_type_id }
          end,
        )
      end
    rescue ActiveRecord::LockWaitTimeout
      # A rival's create for this uuid is still running; the client should retry.
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR,
        message: 'Could not create this session, please retry',
      )
    rescue UnknownStreamTypeError => e
      Failure.new(error_code: BinaryProtocol::ErrorCodes::UNSUPPORTED_SENSOR_TYPE, message: e.message)
    rescue DuplicateStreamError
      # A constraint the contract should have caught (today: one stream per sensor
      # type). Deliberately generic — no raw database text.
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::VALIDATION_ERROR,
        message: 'Request conflicts with an existing record',
      )
    # Re-raised from the rescue above when the conflict was not a session this
    # request may reuse — most often index_devices_on_user_id_and_mac_address,
    # which find_or_create_device races when two creates for one AirBeam arrive
    # under different uuids. Do not narrow this to the uuid constraint.
    rescue ActiveRecord::RecordNotUnique => e
      # errors render straight to the client, and a PG::UniqueViolation message
      # carries the constraint name and a DETAIL line quoting the conflicting
      # values. Only this class needs suppressing — the ones below are app-written.
      Rails.logger.warn("[FixedSessions::Creator] #{e.class}: #{e.message}")
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR,
        message: 'Could not create this session',
      )
    rescue ActiveRecord::RecordInvalid => e
      # The uuid belongs to a row that committed before this request started. The
      # contract no longer asks whether a uuid is free, so the model's uniqueness
      # validation is what catches it. Not scoped to the current user: that
      # validation is global, so another user's uuid is refused here too.
      return uuid_taken if uuid_taken_error?(e)

      Failure.new(error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR, message: e.message)
    rescue ActiveRecord::RecordNotFound => e
      Failure.new(error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR, message: e.message)
    end

    private

    def uuid_taken_error?(error)
      error.record.is_a?(Session) && error.record.errors.of_kind?(:uuid, :taken)
    end

    def uuid_taken
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::SESSION_UUID_TAKEN,
        message: UUID_TAKEN_MESSAGE,
      )
    end

    # Only a row this request could itself have produced: created by this endpoint
    # (token, streams, sensor types) *and* bound to the AirBeam this request is
    # configuring. create_session stores the device and create_streams stamps its
    # mac on every stream, so a row belonging to another AirBeam is identifiable —
    # and handing back its session_token would flash this device with it, putting
    # two physical AirBeams on one session with interleaved streams and no error
    # anywhere. Same failure the legacy path refuses via session_token.present?.
    #
    # No payload comparison here, unlike SessionBuilder's same_recording check.
    # There the payload defines the recording, so two different sessions can share
    # a uuid and must be told apart. Here start_time_local and end_time_local are
    # server-generated (Time.current at create), so they cannot distinguish two
    # payloads at all, and the uuid, the endpoint shape and the physical device are
    # already pinned below. What remains — title, coordinates — would leave the
    # winner's values on a session both requests agree is the same station: wrong
    # label, not lost data.
    def reusable_session(data, user)
      # LOWER() because the model's uniqueness validation and the index that just
      # refused us are both case-insensitive.
      session =
        user.sessions
            .where('LOWER(sessions.uuid) = ?', data[:uuid].to_s.downcase)
            .where(type: 'FixedSession')
            .first

      return nil if session.nil?

      streams = session.streams.to_a # also memoised for the response

      reusable =
        session.session_token.present? &&
        streams.any? &&
        streams.all? { |stream| stream.sensor_type_id.present? } &&
        session.device&.mac_address ==
          Device.normalize_mac_address(data.dig(:airbeam, :mac_address))

      reusable ? session : nil
    end

    def find_or_create_device(airbeam_params, user)
      # Scoped to the caller: a mac_address identifies a device only within one
      # user's account (see Device).
      device =
        user.devices.find_or_initialize_by(
          mac_address: Device.normalize_mac_address(airbeam_params[:mac_address]),
        )
      device.model = airbeam_params[:model]
      device.name = airbeam_params[:name] if airbeam_params.key?(:name)
      device.save!
      device
    end

    def create_session(data, user, device)
      time_zone =
        data[:time_zone].presence ||
        TimeZoneFinderWrapper.instance.time_zone_at(
          lat: data[:latitude],
          lng: data[:longitude],
        )
      url_token = TokenGenerator.new.generate_unique(5) { |t| !Session.exists?(url_token: t) }

      now = Time.current

      FixedSession.create!(
        uuid: data[:uuid],
        title: data[:title],
        latitude: data[:latitude],
        longitude: data[:longitude],
        user: user,
        device: device,
        time_zone: time_zone,
        url_token: url_token,
        session_token: session_token,
        start_time_local: now,
        end_time_local: now,
        is_indoor: data.fetch(:is_indoor, false),
        contribute: data[:contribute],
      )
    end

    def session_token
      loop do
        t = SecureRandom.hex(16)
        break t unless t == '0' * 32 || t == 'f' * 32
      end
    end

    def create_streams(data, session)
      streams_repository = StreamsRepository.new

      data[:streams].map do |stream_params|
        canonical = Sensor.canonical_sensor_name(stream_params[:sensor_name])
        type_id = Sensor::CANONICAL_SENSOR_TYPE_IDS[canonical]
        raise UnknownStreamTypeError, "unsupported sensor: #{stream_params[:sensor_name]}" unless type_id

        unit_symbol = stream_params[:unit_symbol]
        threshold_set = find_or_create_threshold_set(canonical, unit_symbol)

        stream = streams_repository.create!(
          params: {
            session: session,
            sensor_name: stream_params[:sensor_name],
            sensor_package_name: stream_package_name(session.device),
            unit_name: Sensor::CANONICAL_UNIT_NAMES[canonical],
            unit_symbol: unit_symbol,
            measurement_type: Sensor::CANONICAL_MEASUREMENT_TYPES[canonical],
            measurement_short_type: Sensor::CANONICAL_MEASUREMENT_SHORT_TYPES[canonical],
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
      # One stream per sensor type is a database constraint; the contract rejects
      # a repeated type first, so arriving here means a request it let through.
      # Retyped so the rescue chain in #call can tell it from a uuid or device
      # conflict without matching on PG message text.
      raise DuplicateStreamError
    end

    # `<Model>:<mac>` is the shape every legacy row uses, and the
    # `Sessions::IndexInteractor` package-name filter lowercases everything after
    # the first separator, so the mac is stored lowercased here even though
    # `devices.mac_address` keeps its canonical upper-case form. Falls back to the
    # column default when a session has no device.
    def stream_package_name(device)
      return 'Builtin' unless device

      "#{device.model}:#{device.mac_address.downcase}"
    end

    def find_or_create_threshold_set(canonical, unit_symbol)
      ThresholdSet.find_by!(sensor_name: canonical, unit_symbol: unit_symbol, is_default: true)
    rescue ActiveRecord::RecordNotFound
      raise ActiveRecord::RecordNotFound,
            "No default ThresholdSet for #{canonical} (#{unit_symbol}) — run db:seed"
    end
  end
end
