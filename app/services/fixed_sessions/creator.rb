module FixedSessions
  class Creator
    UnknownStreamTypeError = Class.new(StandardError)

    def call(data:, user:)
      ActiveRecord::Base.transaction do
        device = find_or_create_device(data[:airbeam])
        session = create_session(data, user, device)
        streams = create_streams(data, session)
        Success.new(session: session, streams: streams)
      end
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound, UnknownStreamTypeError => e
      Failure.new(base: [e.message])
    end

    private

    def find_or_create_device(airbeam_params)
      device = Device.find_or_initialize_by(mac_address: airbeam_params[:mac_address])
      device.model = airbeam_params[:model]
      device.name = airbeam_params[:name] if airbeam_params.key?(:name)
      device.save!
      device
    end

    def create_session(data, user, device)
      time_zone = TimeZoneFinderWrapper.instance.time_zone_at(
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
        start_time_local: now,
        end_time_local: now,
        is_indoor: data.fetch(:is_indoor, false),
        contribute: data[:contribute],
      )
    end

    def create_streams(data, session)
      streams_repository = StreamsRepository.new

      data[:streams].map do |stream_params|
        canonical = Sensor.canonical_sensor_name(stream_params[:sensor_name])
        type_id = Sensor::CANONICAL_SENSOR_TYPE_IDS[canonical]
        raise UnknownStreamTypeError, "unsupported sensor: #{stream_params[:sensor_name]}" unless type_id

        unit_symbol = stream_params[:unit_symbol]
        threshold_set = find_or_create_threshold_set(canonical, unit_symbol)

        streams_repository.create!(
          params: {
            session: session,
            sensor_name: canonical,
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
          sensor_name: canonical,
          sensor_type_id: type_id,
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
