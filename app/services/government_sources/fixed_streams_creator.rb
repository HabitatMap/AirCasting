module GovernmentSources
  class FixedStreamsCreator
    def initialize(repository: Repository.new, stream_defaults: StreamDefaults.new)
      @repository = repository
      @stream_defaults = stream_defaults
    end

    def call(stations:, source_name:)
      return if stations.empty?

      create_fixed_streams(stations, source_name)
    end

    private

    attr_reader :repository, :stream_defaults

    def create_fixed_streams(stations, source_name)
      defaults = stream_defaults.call
      current_time = Time.current

      ApplicationRecord.transaction do
        session_ids = create_sessions(stations, current_time, source_name)
        stream_ids =
          create_streams(
            stations,
            session_ids,
            defaults,
            current_time,
            source_name,
          )
        create_fixed_stream_records(stations, stream_ids, current_time)
      end
    end

    # LEGACY: Creates FixedSession records for backwards compatibility with
    # the existing Session-based model. These link to the legacy User model.
    # TODO: Remove when migrating to FixedStream-only model.
    def create_sessions(stations, current_time, source_name)
      user = repository.user(source_name: source_name)

      session_params =
        stations.map do |station|
          {
            user_id: user.id,
            type: 'FixedSession',
            title: station.title,
            latitude: station.latitude,
            longitude: station.longitude,
            time_zone: station.time_zone,
            uuid: SecureRandom.uuid,
            url_token: station.url_token,
            contribute: true,
            is_indoor: false,
            created_at: current_time,
            updated_at: current_time,
          }
        end

      insert_sessions!(session_params)
    end

    # LEGACY: Creates Stream records for backwards compatibility.
    # Streams store measurement metadata and link to the legacy Session model.
    # TODO: Remove when migrating to FixedStream-only model.
    def create_streams(
      stations,
      session_ids,
      defaults,
      current_time,
      source_name
    )
      sensor_package = repository.sensor_package_name(source_name: source_name)

      stream_params =
        stations.each_with_index.map do |station, idx|
          station_defaults = defaults[station.measurement_type]
          {
            session_id: session_ids[idx],
            sensor_name: station_defaults.fetch(:sensor_name),
            unit_name: station_defaults.fetch(:unit_name),
            measurement_type: station_defaults.fetch(:measurement_type),
            measurement_short_type:
              station_defaults.fetch(:measurement_short_type),
            unit_symbol: station_defaults.fetch(:unit_symbol),
            sensor_package_name: sensor_package,
            threshold_set_id: station_defaults.fetch(:threshold_set_id),
            min_latitude: station.latitude,
            max_latitude: station.latitude,
            min_longitude: station.longitude,
            max_longitude: station.longitude,
            start_latitude: station.latitude,
            start_longitude: station.longitude,
          }
        end

      insert_streams!(stream_params)
    end

    # FixedStream is the target model - this is NOT legacy
    def create_fixed_stream_records(stations, stream_ids, current_time)
      fixed_streams_params =
        stations.each_with_index.map do |station, idx|
          {
            external_ref: station.external_ref,
            location: station.location,
            time_zone: station.time_zone,
            title: station.title,
            url_token: station.url_token,
            source_id: station.source_id,
            stream_configuration_id: station.stream_configuration_id,
            stream_id: stream_ids[idx],
            created_at: current_time,
            updated_at: current_time,
          }
        end

      insert_fixed_streams!(fixed_streams_params)
    end

    # LEGACY: Bulk insert into sessions table
    def insert_sessions!(session_params)
      result = Session.insert_all!(session_params, returning: %w[id])
      result.rows.flatten
    end

    # LEGACY: Bulk insert into streams table
    def insert_streams!(stream_params)
      result = Stream.insert_all!(stream_params, returning: %w[id])
      result.rows.flatten
    end

    def insert_fixed_streams!(fixed_streams_params)
      FixedStream.upsert_all(
        fixed_streams_params,
        unique_by: %i[source_id stream_configuration_id external_ref],
      )
    end
  end
end
