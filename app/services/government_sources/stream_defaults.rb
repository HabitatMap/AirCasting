module GovernmentSources
  class StreamDefaults
    # LEGACY: defaults used for backwards compatibility.
    # TODO: Remove when migrating to FixedStream-only model.
    SENSOR_NAMES = %w[Government-PM2.5 Government-NO2 Government-Ozone].freeze

    def call
      threshold_sets =
        ThresholdSet.where(sensor_name: SENSOR_NAMES).index_by(&:sensor_name)

      {
        'PM2.5' => {
          sensor_name: 'Government-PM2.5',
          unit_name: 'microgram per cubic meter',
          measurement_type: 'Particulate Matter',
          measurement_short_type: 'PM',
          unit_symbol: 'µg/m³',
          threshold_set_id: threshold_sets['Government-PM2.5']&.id,
        },
        'NO2' => {
          sensor_name: 'Government-NO2',
          unit_name: 'parts per billion',
          measurement_type: 'Nitrogen Dioxide',
          measurement_short_type: 'NO2',
          unit_symbol: 'ppb',
          threshold_set_id: threshold_sets['Government-NO2']&.id,
        },
        'Ozone' => {
          sensor_name: 'Government-Ozone',
          unit_name: 'parts per billion',
          measurement_type: 'Ozone',
          measurement_short_type: 'O3',
          unit_symbol: 'ppb',
          threshold_set_id: threshold_sets['Government-Ozone']&.id,
        },
      }
    end
  end
end
