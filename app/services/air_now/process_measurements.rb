class AirNow::ProcessMeasurements
  def initialize(measurements)
    @measurements = measurements
  end

  def call
    @measurements.each_with_object([]) do |measurement, processed_measurements|
      next unless wanted_sensor_name?(measurement)

      measurement[:parameter] = normalize_sensor_name(measurement)
      processed_measurements << create_saveable_object(measurement)
    end
  end

  private

  attr_reader :measurements

  def wanted_sensor_name?(measurement)
    ['PM2.5', 'O3', 'NO2', 'OZONE'].include?(measurement[:parameter])
  end

  def normalize_sensor_name(measurement)
    measurement[:parameter] == 'OZONE' ? 'O3' : measurement[:parameter]
  end

  def convert_datetime(time, date)
    full_year_date = Date.strptime(date, "%m/%d/%y").strftime("%Y-%m-%d")
    Time.parse("#{full_year_date} #{time}")
  end

  def create_saveable_object(measurement)
    time_utc = convert_datetime(measurement[:time], measurement[:date])
    end_time_utc = time_utc + 1.hour
    time_local = end_time_utc + measurement[:timezone].to_i.hours

    AirNow::Measurement.new(
      sensor_name: normalize_sensor_name(measurement),
      value: measurement[:value],
      latitude: measurement[:latitude],
      longitude: measurement[:longitude],
      time_local: time_local,
      time_utc: end_time_utc,
      title: sanitize(measurement[:location]),
    )
  end

  def sanitize(location_name)
    location_name.force_encoding("ASCII-8BIT").encode("UTF-8", invalid: :replace, undef: :replace, replace: "?")
  end
end
