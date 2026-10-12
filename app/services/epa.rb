module Epa
  MEASUREMENT_TYPES = %w[PM2.5 Ozone NO2].freeze

  module_function

  def normalized_measurement_type(parameter_name)
    case parameter_name
    when 'PM2.5'
      'PM2.5'
    when 'O3', 'OZONE'
      'Ozone'
    when 'NO2'
      'NO2'
    end
  end

  # AirNow files are UTF-8 but arrive from the HTTP client tagged as binary.
  # Read them as UTF-8 and replace only byte sequences that are not valid UTF-8.
  def sanitize_data(data)
    data.dup.force_encoding('UTF-8').scrub("\uFFFD")
  end
end
