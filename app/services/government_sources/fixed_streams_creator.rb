module GovernmentSources
  class FixedStreamsCreator
    def initialize(repository: Repository.new, stream_defaults: StreamDefaults.new)
      @repository = repository
      @stream_defaults = stream_defaults
    end

    def call(rows:, source_name:)
      return if rows.empty?

      create_fixed_streams(rows, source_name)
    end

    private

    attr_reader :repository, :stream_defaults

    def create_fixed_streams(rows, source_name)
      defaults = stream_defaults.call
      current_time = Time.current

      ApplicationRecord.transaction do
        session_ids = create_sessions(rows, current_time, source_name)
        stream_ids =
          create_streams(
            rows,
            session_ids,
            defaults,
            current_time,
            source_name,
          )
        create_fixed_stream_records(rows, stream_ids, current_time)
      end
    end

    # LEGACY: Creates FixedSession records for backwards compatibility with
    # the existing Session-based model. These link to the legacy User model.
    # TODO: Remove when migrating to FixedStream-only model.
    def create_sessions(rows, current_time, source_name)
      user = repository.user(source_name: source_name)

      session_params =
        rows.map do |row|
          {
            user_id: user.id,
            type: 'FixedSession',
            title: row.title,
            latitude: row.latitude,
            longitude: row.longitude,
            time_zone: row.time_zone,
            uuid: SecureRandom.uuid,
            url_token: row.url_token,
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
      rows,
      session_ids,
      defaults,
      current_time,
      source_name
    )
      sensor_package = repository.sensor_package_name(source_name: source_name)

      stream_params =
        rows.each_with_index.map do |row, idx|
          stream_defaults = defaults[row.measurement_type]
          {
            session_id: session_ids[idx],
            sensor_name: stream_defaults.fetch(:sensor_name),
            unit_name: stream_defaults.fetch(:unit_name),
            measurement_type: stream_defaults.fetch(:measurement_type),
            measurement_short_type:
              stream_defaults.fetch(:measurement_short_type),
            unit_symbol: stream_defaults.fetch(:unit_symbol),
            sensor_package_name: sensor_package,
            threshold_set_id: stream_defaults.fetch(:threshold_set_id),
            min_latitude: row.latitude,
            max_latitude: row.latitude,
            min_longitude: row.longitude,
            max_longitude: row.longitude,
            start_latitude: row.latitude,
            start_longitude: row.longitude,
          }
        end

      insert_streams!(stream_params)
    end

    # FixedStream is the target model - this is NOT legacy
    def create_fixed_stream_records(rows, stream_ids, current_time)
      fixed_streams_params =
        rows.each_with_index.map do |row, idx|
          {
            external_ref: row.external_ref,
            location: row.location,
            time_zone: row.time_zone,
            title: row.title,
            url_token: row.url_token,
            source_id: row.source_id,
            stream_configuration_id: row.stream_configuration_id,
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
