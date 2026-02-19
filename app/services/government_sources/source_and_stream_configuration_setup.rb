module GovernmentSources
  class SourceAndStreamConfigurationSetup
    def call
      ActiveRecord::Base.transaction do
        create_stream_configurations
        setup_epa_source
        setup_eea_source
      end
    end

    private

    def create_stream_configurations
      stream_configurations.each do |attributes|
        StreamConfiguration.find_or_create_by!(
          measurement_type: attributes[:measurement_type],
          unit_symbol: attributes[:unit_symbol],
        ) { |record| record.assign_attributes(attributes) }
      end
    end

    def setup_epa_source
      source = Source.find_or_create_by!(name: 'EPA')
      assign_configurations(source, epa_config_keys)
    end

    def setup_eea_source
      source = Source.find_or_create_by!(name: 'EEA')
      assign_configurations(source, eea_config_keys)
    end

    def assign_configurations(source, config_keys)
      config_keys.each do |key|
        config = stream_configurations_by_key[key]
        stream_configuration =
          StreamConfiguration.find_by!(
            measurement_type: config[:measurement_type],
            unit_symbol: config[:unit_symbol],
          )
        SourceStreamConfiguration.find_or_create_by!(
          source: source,
          stream_configuration: stream_configuration,
        )
      end
    end

    def epa_config_keys
      %i[pm25_canonical no2_canonical ozone_canonical]
    end

    def eea_config_keys
      %i[pm25_canonical no2_eea ozone_eea]
    end

    def stream_configurations
      stream_configurations_by_key.values
    end

    def stream_configurations_by_key
      @stream_configurations_by_key ||= {
        pm25_canonical: {
          measurement_type: 'PM2.5',
          unit_symbol: 'µg/m³',
          threshold_very_low: 0,
          threshold_low: 9,
          threshold_medium: 35,
          threshold_high: 55,
          threshold_very_high: 150,
          canonical: true,
        },
        no2_canonical: {
          measurement_type: 'NO2',
          unit_symbol: 'ppb',
          threshold_very_low: 0,
          threshold_low: 53,
          threshold_medium: 100,
          threshold_high: 360,
          threshold_very_high: 649,
          canonical: true,
        },
        ozone_canonical: {
          measurement_type: 'Ozone',
          unit_symbol: 'ppb',
          threshold_very_low: 0,
          threshold_low: 59,
          threshold_medium: 75,
          threshold_high: 95,
          threshold_very_high: 115,
          canonical: true,
        },
        no2_eea: {
          measurement_type: 'NO2',
          unit_symbol: 'µg/m³',
          threshold_very_low: 0,
          threshold_low: 100,
          threshold_medium: 188,
          threshold_high: 677,
          threshold_very_high: 1220,
          canonical: false,
        },
        ozone_eea: {
          measurement_type: 'Ozone',
          unit_symbol: 'µg/m³',
          threshold_very_low: 0,
          threshold_low: 116,
          threshold_medium: 147,
          threshold_high: 186,
          threshold_very_high: 225,
          canonical: false,
        },
      }
    end
  end
end
