require 'rails_helper'

describe OpenAq::FilterMeasurements do
  it 'keeps only pm2.5 and no3 measurements' do
    non_pm25 = build_open_aq_measurement(sensor_name: random_string)
    pm25 = build_open_aq_measurement(sensor_name: 'pm25')
    o3 = build_open_aq_measurement(sensor_name: 'o3')

    actual = subject.call(measurements: [non_pm25, pm25, o3])

    expect(actual).to eq([pm25, o3])
  end
end
