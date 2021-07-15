MEASUREMENT_HEADING_PREFIX = %w[
  ObjectID
  Session_Name
  Timestamp
  Latitude
  Longitude
]
PADDING = Array.new(MEASUREMENT_HEADING_PREFIX.size, nil)

class Csv::AppendMeasurementsContent
  def call(csv, data)
    append_headings(csv, data)
    Csv::AppendMeasurements.new(csv, data).call
  end

  private

  def append_headings(csv, data)
    csv <<
      padded_repeated_heading(%w[Sensor_Package_Name], data.amount_of_streams)
    csv << padded_heading([data.sensor_package_name] * data.amount_of_streams)
    csv << padded_repeated_heading(%w[Sensor_Name], data.amount_of_streams)
    csv << padded_heading(data.sensor_names)
    csv << padded_repeated_heading(%w[Measurement_Type], data.amount_of_streams)
    csv << padded_heading(data.measurement_types)
    csv <<
      padded_repeated_heading(%w[Measurement_Units], data.amount_of_streams)
    csv << padded_heading(data.measurement_units)
    csv << measurement_heading(data.amount_of_streams)
  end

  def padded_repeated_heading(heading, amount)
    padded_heading(heading * amount)
  end

  def padded_heading(heading)
    PADDING + heading
  end

  def measurement_heading(amount)
    MEASUREMENT_HEADING_PREFIX +
      1.upto(amount).map { |i| "#{i}:Measurement_Value" }
  end
end

class Csv::AppendMeasurements
  def initialize(csv, data)
    @object_id = 1
    @line = []
    @cached = {}
    @previous_stream_sensor_name = ''
    @data = data
    @csv = csv
  end

  def call
    @data.measurements.each do |measurement|
      if @object_id == 1
        first_measurement_on_the_line(measurement)
      elsif is_new_line(measurement)
        start_new_line(measurement)
      else
        add_to_current_line(measurement)
      end
      @previous_stream_sensor_name = measurement['stream_sensor_name']
    end

    return if @object_id == 1

    pad_right_by(@data.amount_of_streams)
    @csv << @line
  end

  private

  def first_measurement_on_the_line(measurement)
    @line = measurement_line(measurement)
    @cached = cache(measurement)
    @object_id += 1
  end

  def start_new_line(measurement)
    pad_right_by(@data.amount_of_streams)
    @csv << @line
    first_measurement_on_the_line(measurement)
  end

  def add_to_current_line(measurement)
    # If the sensor sent more than one measurement for the same location
    # and timestamp ignore all but the first one
    unless @previous_stream_sensor_name == measurement['stream_sensor_name']
      amount = @data.sensor_names.index(measurement['stream_sensor_name'])
      pad_right_by(amount)
      @line << measurement['measurement_value']
    end
  end

  def pad_right_by(amount)
    (amount + PADDING.size - @line.size).times { |_| @line << nil }
  end

  def measurement_line(measurement)
    columns_before = @data.sensor_names.index(measurement['stream_sensor_name'])

    [
      @object_id,
      measurement['session_title'],
      format_time(
        measurement['measurement_time'],
        measurement['measurement_milliseconds']
      ),
      measurement['measurement_latitude'],
      measurement['measurement_longitude']
    ] + Array.new(columns_before, nil) + [measurement['measurement_value']]
  end

  def format_time(time, milliseconds)
    with_milliseconds = time + (milliseconds / 1000.0)
    with_milliseconds.strftime('%FT%T.%L')
  end

  def is_new_line(measurement)
    measurement['measurement_time'] != @cached['time'] ||
      measurement['measurement_milliseconds'] != @cached['milliseconds'] ||
      measurement['measurement_latitude'] != @cached['latitude'] ||
      measurement['measurement_longitude'] != @cached['longitude']
  end

  def cache(measurement)
    {
      'time' => measurement['measurement_time'],
      'milliseconds' => measurement['measurement_milliseconds'],
      'latitude' => measurement['measurement_latitude'],
      'longitude' => measurement['measurement_longitude']
    }
  end
end
