require 'rails_helper'

LAST_SEEN = 'last_seen'
LATITUDE = 'latitude'
LONGITUDE = 'longitude'
NAME = 'name'
SENSOR_INDEX = 'sensor_index'
VALUE = 'pm2.5_10minute_a'
FIELD_NAMES = {
  last_seen: LAST_SEEN,
  latitude: LATITUDE,
  longitude: LONGITUDE,
  name: NAME,
  sensor_index: SENSOR_INDEX,
  value: VALUE,
}
ORDERED_FIELDS = [SENSOR_INDEX, NAME, VALUE, LATITUDE, LONGITUDE, LAST_SEEN]

MEASUREMENTS_FIELDS = [
# [SENSOR_INDEX, NAME, VALUE, LATITUDE, LONGITUDE, LAST_SEEN]
  [129_737, 'HOPE-Jane', 27.9, 36.604595, -82.14892, 1_641_478_965],
  [129_783, 'MV Clean Air Ambassador @ Liberty Bell High School', 10.7, 48.442444, -120.16977, 1_641_478_950],
  [130_003, 'Silicon Nati Outside', 0.0, -36.74553, 141.94203, 1_641_478_967]
]

describe PurpleAir::ParseFields do
  it 'parses measurements_fields' do
    value = 27.9
    latitude = 36.604595
    longitude = -82.14892
    time = Time.current.to_i
    sensor_index = 129_737
    name = 'HOPE-Jane'
    measurements_fields = [[sensor_index, name, value, latitude, longitude, time]]

    actual = described_class
      .new(
        field_names: FIELD_NAMES,
        ordered_fields: ORDERED_FIELDS,
        utc_to_local: ->(time, _lat, _lng) { time }
      )
      .call(measurements_fields)

      expect(actual.map { _1.value }).to eq([value])
      expect(actual.map { _1.latitude }).to eq([latitude])
      expect(actual.map { _1.longitude }).to eq([longitude])
      expect(actual.map { _1.time_utc }).to eq([Time.at(time)])
      expect(actual.map { _1.time_local }).to eq([Time.at(time)])
      expect(actual.map { _1.title }).to eq(["#{name} (#{sensor_index})"])
  end

  it 'skips invalid measurements_fields' do
    value = 27.9
    latitude = 36.604595
    longitude = -82.14892
    time = Time.current.to_i
    sensor_index = 129_737
    name = 'HOPE-Jane'
    measurements_fields = [[sensor_index, name, value, latitude, longitude, time]]
    measurements_fields[0][(0..5).to_a.sample] = nil

    actual = described_class
      .new(
        field_names: FIELD_NAMES,
        ordered_fields: ORDERED_FIELDS,
        utc_to_local: ->(time, _lat, _lng) { time }
      )
      .call(measurements_fields)

      expect(actual).to eq([])
  end

  it 'skips invalid coordinates' do
    latitude = 1234
    longitude = 1234
    measurements_fields = [[129_737, 'HOPE-Jane', 27.9, latitude, longitude, Time.current.to_i]]

    actual = described_class
      .new(
        field_names: FIELD_NAMES,
        ordered_fields: ORDERED_FIELDS,
        utc_to_local: PurpleAir::UtcToLocal.new
      )
      .call(measurements_fields)

      expect(actual).to eq([])
  end

  it 'transforms utc time into local time depending on coordinates' do
    latitude = 50.049683 # krakow
    longitude = 19.944544 # krakow
    utc_time = Time.current.to_i
    measurements_fields = [[129_737, 'HOPE-Jane', 27.9, latitude, longitude, utc_time]]

    actual = described_class
      .new(
        field_names: FIELD_NAMES,
        ordered_fields: ORDERED_FIELDS,
        utc_to_local: PurpleAir::UtcToLocal.new
      )
      .call(measurements_fields)

      expect(actual.map { _1.time_utc }).to eq([Time.at(utc_time)])
      expect(actual.map { _1.time_local }).to eq(
        [Time.at(utc_time).in_time_zone('Europe/Warsaw').to_datetime.change(offset: 0)]
      )
  end
end
