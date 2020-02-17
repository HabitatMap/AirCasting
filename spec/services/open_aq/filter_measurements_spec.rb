require 'rails_helper'

describe OpenAq::FilterMeasurements do
  it 'keeps only pm2.5 measurements' do
    non_pm25 = build_open_aq_measurement(sensor_name: random_string)
    to_keep = build_open_aq_measurement(sensor_name: 'pm25')

    actual = subject.call(measurements: [non_pm25, to_keep])

    expect(actual).to eq([to_keep])
  end
end
