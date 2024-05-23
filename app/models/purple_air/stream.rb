# this model is no longer in use and can be deleted - PurpleAir data is no longer fetched
module PurpleAir
  DEFAULTS = {
    measurement_short_type: 'PM',
    measurement_type: 'Particulate Matter',
    sensor_name: 'PurpleAir-PM2.5',
    sensor_package_name: 'PurpleAir-PM2.5',
    threshold_high: 55,
    threshold_low: 12,
    threshold_medium: 35,
    threshold_very_high: 150,
    threshold_very_low: 0,
    unit_name: 'microgram per cubic meter',
    unit_symbol: 'µg/m³',
  }

  Stream =
    Struct.new(
      :latitude,
      :longitude,
      :measurement_short_type,
      :measurement_type,
      :sensor_name,
      :sensor_package_name,
      :threshold_high,
      :threshold_low,
      :threshold_medium,
      :threshold_very_high,
      :threshold_very_low,
      :unit_name,
      :unit_symbol,
      keyword_init: true
    ) do
      def initialize(**kwargs)
        super
        DEFAULTS.each { |key, value| self[key] = value }
      end
    end
end
