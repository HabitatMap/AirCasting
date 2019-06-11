class Csv::MeasurementsData
  attr_reader :session_id,
              :amount_of_streams,
              :stream_parameters,
              :measurements,
              :sensor_package_name

  def initialize(data)
    @session_id = data.fetch('session_id')
    @amount_of_streams = data.fetch('amount_of_streams')
    @stream_parameters = data.fetch('stream_parameters')
    @measurements = data.fetch('measurements')
    @sensor_package_name = data.fetch('sensor_package_name')
  end

  def sensor_names
    @stream_parameters['sensor_names']
  end

  def measurement_types
    @stream_parameters['measurement_types']
  end

  def measurement_units
    @stream_parameters['measurement_units']
  end
end
