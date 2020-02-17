class OpenAq::FilterMeasurements
  SENSOR_NAME = 'pm25'

  def call(measurements:)
    measurements.filter { |measurement| measurement.sensor_name == SENSOR_NAME }
  end
end
