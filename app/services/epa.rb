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

  def sanitize_data(data)
    data
      .force_encoding('ASCII-8BIT')
      .encode('UTF-8', invalid: :replace, undef: :replace, replace: "\uFFFD")
  end
end
