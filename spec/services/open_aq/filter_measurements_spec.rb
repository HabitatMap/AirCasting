require 'rails_helper'

describe OpenAq::FilterMeasurements do
  it 'keeps only pm2.5 measurements from the US' do
    non_pm25 =
      build_open_aq_measurement(country: 'US', sensor_name: random_string)
    non_us =
      build_open_aq_measurement(country: random_string, sensor_name: 'pm25')
    to_keep = build_open_aq_measurement(country: 'US', sensor_name: 'pm25')

    actual = subject.call(measurements: [non_pm25, non_us, to_keep])

    expect(actual).to eq([to_keep])
  end
end
