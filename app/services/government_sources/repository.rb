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
        .where(source_id: source_id(source_name:))
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

    private

    def source_config(source_name)
      SOURCE_CONFIGS.fetch(source_name)
    end
  end
end
