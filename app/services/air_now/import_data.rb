class AirNow::ImportData
  def initialize(http_client: Http.new)
    @http_client = http_client
  end

  def call
    current_utc = DateTime.now.new_offset(0).beginning_of_hour - 1.hour

    hourly_data = ""

    (current_utc - 24.hours).step(current_utc, 1/24.0).each do |utc_time|
      data = http_client.get(hourly_data_endpoint(utc_time))
      measurements_to_import = substract_cached_data(data, utc_time)
      hourly_data.concat(measurements_to_import)

      # only for logging, delete berofe merge

      measurements_to_import_count = measurements_to_import.split("\n").size

      measurements_with_wanted_sensors = measurements_to_import.split("\n").select do |line|
        line.split('|')[5].in?(['PM2.5', 'O3', 'NO2', 'OZONE'])
      end.size

      Sidekiq.logger.info "AirNow: Imported data for #{utc_time}, added #{measurements_to_import_count} measurements, #{measurements_with_wanted_sensors} with wanted sensors."

      # end of logging logic
    end

    locations_data = http_client.get(locations_endpoint)

    [locations_data, hourly_data]
  end

  private

  attr_reader :http_client

  def locations_endpoint
    'https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/monitoring_site_locations.dat'
  end

  def hourly_data_endpoint(utc_time)
    formatted_date = utc_time.strftime('%Y%m%d')
    formatted_hour = utc_time.strftime('%H')
    "https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/HourlyData_#{formatted_date}#{formatted_hour}.dat"
  end

  def substract_cached_data(data, utc_time)
    cached_data = Rails.cache.read("air_now_#{utc_time.to_i}")
    Rails.cache.write("air_now_#{utc_time.to_i}", data, expires_in: 25.hours)

    if cached_data
      cached_aqsids = cached_data.split("\n").map { |line| line.split('|')[2] }
      new_data = data.split("\n").reject { |line| cached_aqsids.include?(line.split('|')[2]) }
      data = new_data.join("\n").to_s
    end

    data
  end
end
