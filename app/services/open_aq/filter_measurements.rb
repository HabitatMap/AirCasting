class OpenAq::FilterMeasurements
  SENSOR_NAMES = %w[pm25 o3]

  def call(measurements:)
    measurements.filter do |measurement|
      SENSOR_NAMES.include?(measurement.sensor_name)
    end
  end
end
