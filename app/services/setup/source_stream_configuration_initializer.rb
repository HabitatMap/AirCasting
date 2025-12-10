module Setup
  class SourceStreamConfigurationInitializer
    def call
      ActiveRecord::Base.transaction do
        eea_source = Source.find_or_create_by!(name: 'EEA')

        canonical_configurations.each do |attributes|
          create_stream_configuration(attributes)
        end

        eea_specific_configurations.each do |attributes|
          stream_configuration = create_stream_configuration(attributes)
          assigin_configuration_to_source(eea_source, stream_configuration)
        end
      end
    end

    private

    def create_stream_configuration(attributes)
      StreamConfiguration.find_or_create_by!(
        measurement_type: attributes[:measurement_type],
        unit_symbol: attributes[:unit_symbol],
      ) { |record| record.assign_attributes(attributes) }
    end

    def assigin_configuration_to_source(eea_source, stream_configuration)
      SourceStreamConfiguration.find_or_create_by!(
        source: eea_source,
        stream_configuration: stream_configuration,
      )
    end

    def canonical_configurations
      [
        {
          measurement_type: 'PM2.5',
          unit_symbol: 'µg/m³',
          threshold_very_low: 0,
          threshold_low: 9,
          threshold_medium: 35,
          threshold_high: 55,
          threshold_very_high: 150,
          canonical: true,
        },
        {
          measurement_type: 'NO2',
          unit_symbol: 'ppb',
          threshold_very_low: 0,
          threshold_low: 53,
          threshold_medium: 100,
          threshold_high: 360,
          threshold_very_high: 649,
          canonical: true,
        },
        {
          measurement_type: 'Ozone',
          unit_symbol: 'ppb',
          threshold_very_low: 0,
          threshold_low: 59,
          threshold_medium: 75,
          threshold_high: 95,
          threshold_very_high: 115,
          canonical: true,
        },
      ]
    end

    def eea_specific_configurations
      [
        {
          measurement_type: 'NO2',
          unit_symbol: 'µg/m³',
          threshold_very_low: 0,
          threshold_low: 100,
          threshold_medium: 188,
          threshold_high: 677,
          threshold_very_high: 1220,
          canonical: false,
        },
        {
          measurement_type: 'Ozone',
          unit_symbol: 'µg/m³',
          threshold_very_low: 0,
          threshold_low: 116,
          threshold_medium: 147,
          threshold_high: 186,
          threshold_very_high: 225,
          canonical: false,
        },
      ]
    end
  end
end
