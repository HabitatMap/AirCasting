# files format:
# locations id|parameter|aqsid|location|status|agency|agency_name|epa_region|latitude|longitude|elevation|timezone|country|state|county|city|site_address|site_setting|site_type|site_name|site_code|msa_code|csa_code|tribal_code|monitoring_agency
# measurements date|time|aqsid|location|timezone|parameter|unit|value|attribution
# documentation:
# locations https://docs.airnowapi.org/docs/MonitoringSiteFactSheet.pdf
# measurements https://docs.airnowapi.org/docs/HourlyDataFactSheet.pdf

class AirNow::ParseFiles
  def self.parse_locations(data)
    data.split("\n").map do |line|
      parts = line.split('|')
      {
        parameter: parts[1],
        aqsid: parts[0],
        location: parts[3],
        latitude: parts[8].to_f,
        longitude: parts[9].to_f,
      }
    end
  end

  def self.parse_hourly_data(data, locations)
    data.split("\n").map do |line|
      parts = line.split('|')

      location = locations.find { |loc| parts[2] == (loc[:aqsid]) }
      next unless location

      {
        date: parts[0],
        time: parts[1],
        location: location[:location],
        timezone: parts[4],
        parameter: parts[5],
        value: parts[7].to_f,
        latitude: location[:latitude],
        longitude: location[:longitude],
      }
    end.compact
  end
end
