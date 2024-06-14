# this model is no longer in use and can be deleted - OpenAQ data is no longer fetched
module OpenAq
  DEFAULTS_BY_SENSOR_NAME = {
    'pm25' => {
      sensor_name: 'OpenAQ-PM2.5',
      unit_name: 'microgram per cubic meter',
      measurement_type: 'Particulate Matter',
      measurement_short_type: 'PM',
      unit_symbol: 'µg/m³',
      threshold_very_low: 0,
      threshold_low: 12,
      threshold_medium: 35,
      threshold_high: 55,
      threshold_very_high: 150,
      sensor_package_name: 'OpenAQ-PM2.5'
    },
    'o3' => {
      sensor_name: 'OpenAQ-O3',
      unit_name: 'parts per billion',
      measurement_type: 'Ozone',
      measurement_short_type: 'O3',
      unit_symbol: 'ppb',
      threshold_very_low: 0,
      threshold_low: 59,
      threshold_medium: 75,
      threshold_high: 95,
      threshold_very_high: 115,
      sensor_package_name: 'OpenAQ-O3'
    }
  }

  Stream =
    Struct.new(
      :latitude,
      :longitude,
      :sensor_name,
      :unit_name,
      :measurement_type,
      :measurement_short_type,
      :unit_symbol,
      :threshold_very_low,
      :threshold_low,
      :threshold_medium,
      :threshold_high,
      :threshold_very_high,
      :sensor_package_name,
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
