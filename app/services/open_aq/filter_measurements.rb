class OpenAq::FilterMeasurements
  SENSOR_NAME = 'pm25'
  COUNTRY = 'US'

  def call(measurements:)
    measurements.filter do |measurement|
      measurement.sensor_name == SENSOR_NAME
    end.filter { |measurement| measurement.country == COUNTRY }
  end
end
