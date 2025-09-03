module AirNowStreaming
  class DataParser
    def initialize
      @time_zone_finder = TimeZoneFinderWrapper.instance
    end

    def call(locations_data:, measurements_data:)
      locations = parse_locations(locations_data)
      measurements = parse_measurements(measurements_data, locations)
      measurements
    end

    private

    attr_reader :time_zone_finder

    def parse_locations(locations_data)
      locations = {}

      locations_data
        .split("\n")
        .each do |line|
          parts = line.split('|')
          aqsid = parts[0]

          next if locations.key?(aqsid)

          sanitized_title = sanitize(parts[3])
          latitude = parts[8].to_f.round(3)
          longitude = parts[9].to_f.round(3)
          time_zone =
            time_zone_finder.time_zone_at(lat: latitude, lng: longitude)

          locations[aqsid] = {
            title: sanitized_title,
            latitude: latitude,
            longitude: longitude,
            time_zone: time_zone,
          }
        end

      locations
    end

    def parse_measurements(measurements_data, locations)
      processed_measurements = {}

      measurements_data
        .split("\n")
        .each do |line|
          parts = line.split('|').map(&:strip)

          aqsid = parts[2]
          parameter = parts[5]

          next unless valid_measurement?(aqsid, parameter, locations)

          sensor_name = normalized_sensor_names[parameter]
          measurement_time = calculate_measurement_time(parts[0], parts[1])

          processed_measurements[
            {
              latitude: locations[aqsid][:latitude],
              longitude: locations[aqsid][:longitude],
              sensor_name: sensor_name,
            }
          ] ||= []

          processed_measurements[
            {
              latitude: locations[aqsid][:latitude],
              longitude: locations[aqsid][:longitude],
              sensor_name: sensor_name,
            }
          ] << {
            time:
              local_measurement_time(
                measurement_time,
                locations[aqsid][:time_zone],
              ),
            time_with_time_zone: measurement_time,
            time_zone: locations[aqsid][:time_zone],
            title: locations[aqsid][:title],
            value: parts[7].to_f,
          }
        end

      processed_measurements
    end

    def sanitize(location_name)
      location_name
        .force_encoding('ASCII-8BIT')
        .encode('UTF-8', invalid: :replace, undef: :replace, replace: '?')
    end

    def valid_measurement?(aqsid, parameter, locations)
      desired_sensor_name?(parameter) && locations.key?(aqsid)
    end

    def desired_sensor_name?(parameter)
      %w[PM2.5 O3 NO2 OZONE].include?(parameter)
    end

    def normalized_sensor_names
      {
        'PM2.5' => 'Government-PM2.5',
        'O3' => 'Government-Ozone',
        'NO2' => 'Government-NO2',
        'OZONE' => 'Government-Ozone',
      }
    end

    def calculate_measurement_time(date, time)
      full_date = Date.strptime(date, '%m/%d/%y')
      parsed_time = Time.parse("#{full_date} #{time}")

      parsed_time + 1.hour # Add 1 hour to represent the end time of the measurement
    end

    def local_measurement_time(time_with_time_zone, time_zone)
      utc_offset = time_with_time_zone.in_time_zone(time_zone).utc_offset

      time_with_time_zone + utc_offset
    end
  end
end
