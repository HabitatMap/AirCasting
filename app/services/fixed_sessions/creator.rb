module FixedSessions
  class Creator
    UnknownStreamTypeError = Class.new(StandardError)

    def call(data:, user:)
      # Serialised per uuid: two creates arriving at once would otherwise both
      # pass the uniqueness validation's SELECT and both insert.
      Session.with_uuid_lock(data[:uuid]) do |contended|
        # LOWER() because the contract's uuid rule and the model's uniqueness
        # validation are both case-insensitive, and so is the unique index. order(:id)
        # is redundant while that index stands, and costs nothing if it is dropped.
        existing =
          if contended
            user.sessions
                .where('LOWER(sessions.uuid) = ?', data[:uuid].to_s.downcase)
                .where(type: 'FixedSession')
                .order(:id)
                .first
          end

        # Only a row this endpoint produced can be handed back. A FixedSession
        # created through the legacy /api/realtime/sessions path carries no
        # session_token, and its streams have no sensor_type_id — neither path
        # sets them. Returning one would answer with `session_token: null`, which
        # Android drops and iOS rejects, leaving the AirBeam unconfigured: exactly
        # the dead end this short-circuit exists to avoid. Falling through instead
        # fails the uuid validation and returns the 400 that path has always given.
        existing = nil unless reusable?(existing, data)

        if existing
          # Lost a race with a concurrent create of this uuid. Answer with the
          # winner's row, and with the winner's session_token above all: the token
          # is flashed into the AirBeam over BLE and is how it authenticates every
          # upload, so handing out a second one would leave the device reporting
          # against a session nobody reads.
          Success.new(
            session: existing,
            session_token: existing.session_token,
            # Unordered on purpose: both apps resolve a stream by sensor name,
            # never by position, and create_streams follows the payload's order
            # rather than any sort. Do not "fix" this into an ordered scope.
            streams: existing.streams.map do |stream|
              { sensor_name: stream.sensor_name, sensor_type_id: stream.sensor_type_id }
            end,
          )
        else
          device = find_or_create_device(data[:airbeam])
          session = create_session(data, user, device)
          streams = create_streams(data, session)
          Success.new(session: session, session_token: session.session_token, streams: streams)
        end
      end
    rescue ActiveRecord::LockWaitTimeout
      # Another create for this uuid is still running; the client should retry.
      Failure.new(
        error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR,
        message: 'Could not acquire a lock for this session, please retry',
      )
    rescue UnknownStreamTypeError => e
      Failure.new(error_code: BinaryProtocol::ErrorCodes::UNSUPPORTED_SENSOR_TYPE, message: e.message)
    rescue ActiveRecord::RecordInvalid,
           ActiveRecord::RecordNotFound,
           # Two constraints raise this. devices.mac_address is unique and
           # find_or_create_device is a check-then-insert against it, so two
           # creates for the same AirBeam under *different* uuids race today —
           # with_uuid_lock keys on uuid and does not serialise them. That was an
           # unrescued 500 before this line. sessions.uuid will raise it too once
           # its unique index lands.
           ActiveRecord::RecordNotUnique => e
      Failure.new(error_code: BinaryProtocol::ErrorCodes::INTERNAL_ERROR, message: e.message)
    end

    private

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
    def reusable?(session, data)
      return false if session.nil?

      streams = session.streams.to_a # also memoised for the response below

      session.session_token.present? &&
        streams.any? &&
        streams.all? { |stream| stream.sensor_type_id.present? } &&
        session.device&.mac_address == data.dig(:airbeam, :mac_address)
    end

    def find_or_create_device(airbeam_params)
      device = Device.find_or_initialize_by(mac_address: airbeam_params[:mac_address])
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
            sensor_package_name: data[:airbeam][:mac_address],
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
    end

    def find_or_create_threshold_set(canonical, unit_symbol)
      ThresholdSet.find_by!(sensor_name: canonical, unit_symbol: unit_symbol, is_default: true)
    rescue ActiveRecord::RecordNotFound
      raise ActiveRecord::RecordNotFound,
            "No default ThresholdSet for #{canonical} (#{unit_symbol}) — run db:seed"
    end
  end
end
