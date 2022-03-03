require 'rails_helper'

describe GroupByStream do
  it 'groups measurements by stream' do
    measurement1 = build_open_aq_measurement
    measurement2 = build_open_aq_measurement

    actual = subject.call(measurements: [measurement1, measurement2])

    expected = {
      OpenAq::Stream.new(
        latitude: measurement1.latitude,
        longitude: measurement1.longitude,
        sensor_name: measurement1.sensor_name
      ) => [measurement1],
      OpenAq::Stream.new(
        latitude: measurement2.latitude,
        longitude: measurement2.longitude,
        sensor_name: measurement2.sensor_name
      ) => [measurement2]
    }
    expect(actual).to eq(expected)
  end

  it 'orders measurements in each group by utc time' do
    now = DateTime.current
    measurement1 = build_open_aq_measurement(time_utc: now)
    measurement2 =
      build_open_aq_measurement(
        latitude: measurement1.latitude,
        longitude: measurement1.longitude,
        sensor_name: measurement1.sensor_name,
        time_utc: now - 1.second
      )

    actual = subject.call(measurements: [measurement1, measurement2])

    expected = {
      OpenAq::Stream.new(
        latitude: measurement2.latitude,
        longitude: measurement2.longitude,
        sensor_name: measurement2.sensor_name
      ) => [measurement2, measurement1]
    }
    expect(actual).to eq(expected)
  end
end
