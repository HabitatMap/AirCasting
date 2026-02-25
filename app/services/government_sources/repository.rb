module GovernmentSources
  class Repository
    # LEGACY: Source configurations for backwards compatibility.
    # Maps source identifier to user lookup and sensor_package_name.
    # TODO: Remove when migrating to FixedStream-only model.
    SOURCE_CONFIGS = {
      epa: {
        username: 'US EPA AirNow',
        sensor_package_name: 'epa',
      },
      eea: {
        username: 'EEA',
        sensor_package_name: 'eea',
      },
    }.freeze

    def existing_station_keys(source_name:)
      FixedStream
        .joins(:stream_configuration)
        .where(source_id: source_id(source_name: source_name))
        .pluck('stream_configurations.measurement_type', :external_ref)
        .to_set
    end

    def source_id(source_name:)
      Source.find_by!(name: source_name.to_s.upcase).id
    end

    # LEGACY: User lookup for backwards compatibility.
    # TODO: Remove when migrating to FixedStream-only model.
    def user(source_name:)
      User.find_by!(username: source_config(source_name)[:username])
    end

    # LEGACY: Sensor package name for backwards compatibility.
    # TODO: Remove when migrating to FixedStream-only model.
    def sensor_package_name(source_name:)
      source_config(source_name)[:sensor_package_name]
    end

    def stream_configurations
      StreamConfiguration.where(canonical: true).index_by(&:measurement_type)
    end

    def upsert_station_streams(records:)
      StationStream.upsert_all(
        records,
        unique_by: %i[source_id stream_configuration_id external_ref],
      )
    end

    def existing_station_stream_keys(source_name:)
      StationStream
        .joins(:stream_configuration)
        .where(source_id: source_id(source_name: source_name))
        .pluck('stream_configurations.measurement_type', :external_ref)
        .to_set
    end

    def station_stream_url_token_available?(token)
      !StationStream.where(url_token: token).exists?
    end

    def upsert_station_measurements(records:)
      return if records.empty?

      StationMeasurement.upsert_all(
        records,
        unique_by: %i[station_stream_id measured_at],
        update_only: %i[value],
      )
    end

    def bulk_update_stream_timestamps(bounds_by_stream:)
      return if bounds_by_stream.empty?

      conn = StationStream.connection
      values_sql =
        bounds_by_stream
          .sort_by { |stream_id, _| stream_id }
          .map do |stream_id, bounds|
            "(#{conn.quote(stream_id)}, #{conn.quote(bounds[:min])}::timestamptz, #{conn.quote(bounds[:max])}::timestamptz)"
          end
          .join(', ')

      conn.execute(<<~SQL.squish)
        UPDATE station_streams
        SET
          first_measured_at = COALESCE(LEAST(first_measured_at, v.min_at), v.min_at),
          last_measured_at = COALESCE(GREATEST(last_measured_at, v.max_at), v.max_at),
          updated_at = NOW()
        FROM (VALUES #{values_sql}) AS v(id, min_at, max_at)
        WHERE station_streams.id = v.id
      SQL
    end

    private

    def source_config(source_name)
      SOURCE_CONFIGS.fetch(source_name)
    end
  end
end
