require 'rails_helper'

describe GroupByStream do
  it 'groups measurements by stream' do
    measurement1 = build_air_now_measurement
    measurement2 = build_air_now_measurement

    actual = subject.call(measurements: [measurement1, measurement2])

    expected = {
      AirNow::Stream.new(
        latitude: measurement1.latitude,
        longitude: measurement1.longitude,
        sensor_name: measurement1.sensor_name
      ) => [measurement1],
      AirNow::Stream.new(
        latitude: measurement2.latitude,
        longitude: measurement2.longitude,
        sensor_name: measurement2.sensor_name
      ) => [measurement2]
    }
    expect(actual).to eq(expected)
  end

  it 'orders measurements in each group by time_with_time_zone' do
    now = DateTime.current
    measurement1 = build_air_now_measurement(time_with_time_zone: now)
    measurement2 =
      build_air_now_measurement(
        latitude: measurement1.latitude,
        longitude: measurement1.longitude,
        sensor_name: measurement1.sensor_name,
        time_with_time_zone: now - 1.second
      )

    actual = subject.call(measurements: [measurement1, measurement2])

    expected = {
      AirNow::Stream.new(
        latitude: measurement2.latitude,
        longitude: measurement2.longitude,
        sensor_name: measurement2.sensor_name
      ) => [measurement2, measurement1]
    }
    expect(actual).to eq(expected)
  end
end
