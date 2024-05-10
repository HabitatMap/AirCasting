class AirNow::ProcessMeasurements
  def initialize
    @time_zone_finder = TimeZoneFinderWrapper.instance
  end

  def call(measurements)
    measurements.each_with_object([]) do |measurement, processed_measurements|
      next unless wanted_sensor_name?(measurement[:parameter])

      processed_measurements << create_saveable_object(measurement)
    end
  end

  private

  attr_reader :time_zone_finder

  def wanted_sensor_name?(parameter)
    ['PM2.5', 'O3', 'NO2', 'OZONE'].include?(parameter)
  end

  def normalize_sensor_name(parameter)
    parameter == 'OZONE' ? 'O3' : parameter
  end

  def time_with_time_zone(time, date)
    full_year_date = Date.strptime(date, "%m/%d/%y").strftime("%Y-%m-%d")
    time = Time.parse("#{full_year_date} #{time}")

    # 1h added, cause we want the end time of the measurement and AirNow provides the start time
    time + 1.hour
  end

  def create_saveable_object(measurement)
    time_with_time_zone = time_with_time_zone(measurement[:time], measurement[:date])
    time_zone = time_zone_finder.timezone_at(lng: measurement[:longitude], lat: measurement[:latitude])
    utc_offset = time_with_time_zone.in_time_zone(time_zone).utc_offset
    time_local = time_with_time_zone + utc_offset

    AirNow::Measurement.new(
      sensor_name: normalize_sensor_name(measurement[:parameter]),
      value: measurement[:value],
      latitude: measurement[:latitude],
      longitude: measurement[:longitude],
      time_local: time_local,
      time_with_time_zone: time_with_time_zone,
      title: sanitize(measurement[:location]),
      time_zone: time_zone,
    )
  end

  def sanitize(location_name)
    location_name.force_encoding("ASCII-8BIT").encode("UTF-8", invalid: :replace, undef: :replace, replace: "?")
  end
end
