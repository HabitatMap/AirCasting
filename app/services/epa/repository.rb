module Epa
  class Repository
    def epa_user
      User.find_by!(username: 'US EPA AirNow')
    end

    def stream_defaults
      threshold_sets =
        ThresholdSet
          .where(sensor_name: %w[Government-PM2.5 Government-NO2 Government-Ozone])
          .index_by(&:sensor_name)

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

    def insert_sessions!(session_params:)
      result = Session.insert_all!(session_params, returning: %w[id])
      result.rows.flatten
    end

    def insert_streams!(stream_params:)
      result = Stream.insert_all!(stream_params, returning: %w[id])
      result.rows.flatten
    end

    def insert_fixed_streams!(fixed_streams_params:)
      FixedStream.upsert_all(
        fixed_streams_params,
        unique_by: %i[source_id stream_configuration_id external_ref],
      )
    end
  end
end
