module AirNow
  pm25_threshold_set = ThresholdSet.find_or_create_by!(
    threshold_very_low: 0,
    threshold_low: 12,
    threshold_medium: 35,
    threshold_high: 55,
    threshold_very_high: 150,
    sensor_name: 'Government-PM2.5',
    unit_symbol: 'µg/m³',
  )

  no2_threshold_set = ThresholdSet.find_or_create_by!(
    threshold_very_low: 0,
    threshold_low: 53,
    threshold_medium: 100,
    threshold_high: 360,
    threshold_very_high: 649,
    sensor_name: 'Government-NO2',
    unit_symbol: 'ppb',
  )

  o3_threshold_set = ThresholdSet.find_or_create_by!(
    threshold_very_low: 0,
    threshold_low: 59,
    threshold_medium: 75,
    threshold_high: 95,
    threshold_very_high: 115,
    sensor_name: 'Government-Ozone',
    unit_symbol: 'ppb',
  )

  DEFAULTS_BY_SENSOR_NAME = {
    'PM2.5' => {
      sensor_name: 'Government-PM2.5',
      unit_name: 'microgram per cubic meter',
      measurement_type: 'Particulate Matter',
      measurement_short_type: 'PM',
      unit_symbol: 'µg/m³',
      threshold_set_id: pm25_threshold_set.id,
      sensor_package_name: 'Government-PM2.5'
    },
    'NO2' => {
      sensor_name: 'Government-NO2',
      unit_name: 'parts per billion',
      measurement_type: 'Nitrogen Dioxide',
      measurement_short_type: 'NO2',
      unit_symbol: 'ppb',
      threshold_set_id: no2_threshold_set.id,
      sensor_package_name: 'Government-NO2'
    },
    'O3' => {
      sensor_name: 'Government-Ozone',
      unit_name: 'parts per billion',
      measurement_type: 'Ozone',
      measurement_short_type: 'O3',
      unit_symbol: 'ppb',
      threshold_set_id: o3_threshold_set.id,
      sensor_package_name: 'Government-Ozone'
    }
  }

  Stream =
    Struct.new(
      :latitude,
      :longitude,
      :sensor_name,
      :session_id,
      :unit_name,
      :measurement_type,
      :measurement_short_type,
      :unit_symbol,
      :threshold_set_id,
      :sensor_package_name,
      :time_zone,
      keyword_init: true
    ) do
      def initialize(**kwargs)
        super
        assign_defaults(kwargs[:sensor_name])
      end

      private

      def assign_defaults(sensor_name)
        DEFAULTS_BY_SENSOR_NAME
          .fetch(sensor_name)
          .each { |key, value| self[key] = value }
      end
    end
end
