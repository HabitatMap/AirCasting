class Csv::AppendContent
  MEASUREMENT_HEADING_PREFIX = [ "ObjectID", "Session_Name", "Timestamp", "Latitude", "Longitude" ]
  PADDING = Array.new(MEASUREMENT_HEADING_PREFIX.size, nil)

  def call(csv, data)
    append_headings(csv, data)
    append_measurements(csv, data)
  end

  private

  def append_headings(csv, data)
    csv << padded_repeated_heading(["Sensor_Package_Name"], data.amount_of_streams)
    csv << padded_heading([data.sensor_package_name] * data.amount_of_streams)
    csv << padded_repeated_heading(["Sensor_Name"], data.amount_of_streams)
    csv << padded_heading(data.sensor_names)
    csv << padded_repeated_heading(["Measurement_Type"], data.amount_of_streams)
    csv << padded_heading(data.measurement_types)
    csv << padded_repeated_heading(["Measurement_Units"], data.amount_of_streams)
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
    MEASUREMENT_HEADING_PREFIX + 1.upto(amount).map { |i| "#{i}:Measurement_Value" }
  end

  def measurement_line(object_id, measurement, session_id, sensor_names)
    columns_before = sensor_names.index(measurement["stream_sensor_name"])
    line = [
      object_id,
      measurement["session_title"],
      format_time(measurement["measurement_time"], measurement["measurement_milliseconds"]),
      measurement["measurement_latitude"],
      measurement["measurement_longitude"]
    ] + Array.new(columns_before, nil) + [measurement["measurement_value"]]
  end

  def format_time(time, milliseconds)
    with_milliseconds = time + (milliseconds / 1000.0)
    with_milliseconds.strftime("%FT%T.%L")
  end

  def is_new_line(measurement, cached)
    measurement["measurement_time"] != cached["time"] ||
      measurement["measurement_milliseconds"] != cached["milliseconds"] ||
      measurement["measurement_latitude"] != cached["latitude"] ||
      measurement["measurement_longitude"] != cached["longitude"]
  end

  def cache(measurement)
    {
      "time" => measurement["measurement_time"],
      "milliseconds" => measurement["measurement_milliseconds"],
      "latitude" => measurement["measurement_latitude"],
      "longitude" => measurement["measurement_longitude"]
    }
  end

  def append_measurements(csv, data)
    object_id = 1
    line = []
    cached = {}

    data.measurements.each do |measurement|
      if object_id == 1
        line = measurement_line(object_id, measurement, data.session_id, data.sensor_names)
        cached = cache(measurement)
        object_id += 1
      elsif is_new_line(measurement, cached)
        pad(line, data.amount_of_streams)
        csv << line
        line = measurement_line(object_id, measurement, data.session_id, data.sensor_names)
        cached = cache(measurement)
        object_id += 1
      else
        amount = data.sensor_names.index(measurement["stream_sensor_name"])
        pad(line, amount)
        line << measurement["measurement_value"]
      end
    end

    return if object_id == 1

    pad(line, data.amount_of_streams)
    csv << line
  end

  def pad(line, amount)
    (amount + PADDING.size - line.size).times { |_| line << nil }
  end
end
