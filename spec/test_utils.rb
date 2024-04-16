def create_session_with_streams_and_measurements!(attributes = {})
  session =
    create_session!(
      id: attributes.fetch(:id, random_int),
      contribute: attributes.fetch(:contribute, true),
      start_time_local: attributes.fetch(:start_time_local, DateTime.current),
      end_time_local: attributes.fetch(:end_time_local, DateTime.current),
      user: attributes.fetch(:user) { create_user! },
    )
  stream = create_stream!(session: session)
  create_measurements!(
    stream: stream,
    value: attributes.fetch(:value, 1),
    count: attributes.fetch(:count, 1),
  )

  session
end

def create_session!(attributes = {})
  Session.create!(
    id: attributes.fetch(:id, rand(1_000_000)),
    title: attributes.fetch(:title, 'Example Session'),
    user: attributes.fetch(:user) { create_user! },
    uuid: attributes.fetch(:uuid, "uuid#{rand}"),
    start_time_local: attributes.fetch(:start_time_local, DateTime.current),
    end_time_local: attributes.fetch(:end_time_local, DateTime.current),
    type: attributes.fetch(:type, 'MobileSession'),
    latitude: attributes.fetch(:latitude, 1.0),
    longitude: attributes.fetch(:longitude, 1.0),
    is_indoor: attributes.fetch(:is_indoor, false),
    version: attributes.fetch(:version, 1),
    contribute: attributes.fetch(:contribute, true),
    last_measurement_at:
      attributes.fetch(:last_measurement_at, DateTime.current),
    tag_list: attributes.fetch(:tag_list, []),
  )
end

def create_stream!(attributes = {})
  Stream.create!(
    sensor_package_name: 'AirBeam2:00189610719F',
    sensor_name: attributes.fetch(:sensor_name, 'AirBeam2-F'),
    measurement_type: 'Temperature',
    unit_name: 'Fahrenheit',
    session: attributes.fetch(:session) { create_session! },
    measurement_short_type: 'F',
    unit_symbol: attributes.fetch(:unit_symbol, 'F'),
    threshold_very_low: 20,
    threshold_low: 60,
    threshold_medium: 70,
    threshold_high: 80,
    threshold_very_high: 100,
    min_latitude: attributes.fetch(:min_latitude, 1),
    max_latitude: attributes.fetch(:max_latitude, 1),
    min_longitude: attributes.fetch(:min_longitude, 1),
    max_longitude: attributes.fetch(:max_longitude, 1),
    average_value: attributes.fetch(:average_value, 1.23),
    start_latitude: attributes.fetch(:start_latitude, 1),
    start_longitude: attributes.fetch(:start_longitude, 1),
  )
end

def create_measurement!(attributes = {})
  lat = attributes.fetch(:latitude, 1)
  lon = attributes.fetch(:longitude, 1)

  Measurement.create!(
    time: attributes.fetch(:time, DateTime.current),
    latitude: lat,
    longitude: lon,
    value: attributes.fetch(:value, 123),
    milliseconds: attributes.fetch(:milliseconds, 123),
    stream: attributes.fetch(:stream) { create_stream! },
    location: attributes.fetch(:location) { "SRID=4326;POINT(#{lon} #{lat})" },
  )
end

def create_measurements!(attributes)
  measurements = []
  attributes
    .fetch(:count, 1)
    .times do |n|
      lat = random_float
      lon = random_float

      measurements <<
        Measurement.create!(
          time: Time.current - n.minutes,
          latitude: lat,
          longitude: lon,
          value: attributes.fetch(:value, random_float),
          milliseconds: random_int,
          stream: attributes.fetch(:stream),
          location: "SRID=4326;POINT(#{lon} #{lat})",
        )
    end

  measurements
end

def create_user!(attributes = {})
  User.create!(
    id: attributes.fetch(:id, random_int),
    username: attributes.fetch(:username, random_string),
    email: attributes.fetch(:email, random_email),
    password: random_string,
    session_stopped_alert:
      attributes.fetch(:session_stopped_alert, random_bool),
  )
end

def create_note!(attributes = {})
  Note.create!(
    text: random_string,
    date: random_date_time,
    latitude: random_float,
    longitude: random_float,
    session: attributes.fetch(:session),
    number: random_int,
  )
end

def create_mobile_session!
  create_session!(type: 'MobileSession')
end

def create_fixed_session!
  create_session!(type: 'FixedSession')
end

def create_stream_daily_average!(attributes = {})
  StreamDailyAverage.create!(
    date: attributes.fetch(:date, Date.current),
    value: attributes.fetch(:value, random_float),
    stream: attributes.fetch(:stream) { create_stream! },
  )
end

def random_int
  rand(100_000)
end

def random_small_int
  rand(100)
end

def random_float
  rand * 100
end

def random_big_decimal
  random_float.to_d.round(9)
end

def random_string
  SecureRandom.alphanumeric
end

def random_bool
  [true, false].sample
end

def random_email
  "#{random_string.downcase}@example.com"
end

def random_date_time
  DateTime.current + random_int.days - random_int.days
end

def build_open_aq_measurement(opts = {})
  OpenAq::Measurement.new(
    sensor_name: opts.fetch(:sensor_name, 'pm25'),
    value: opts.fetch(:value, random_float),
    latitude: opts.fetch(:latitude, random_big_decimal),
    longitude: opts.fetch(:longitude, random_big_decimal),
    time_local: random_date_time.change(usec: 0),
    time_utc: opts.fetch(:time_utc, random_date_time).change(usec: 0),
    location: random_string,
    city: random_string,
    country: opts.fetch(:country, random_string),
    unit: opts.fetch(:unit, random_string),
  )
end

def build_open_aq_stream(opts = {})
  OpenAq::Stream.new(
    sensor_name: opts.fetch(:sensor_name),
    latitude: random_big_decimal,
    longitude: random_big_decimal,
  )
end

def build_air_now_stream(opts = {})
  AirNow::Stream.new(
    sensor_name: opts.fetch(:sensor_name),
    latitude: random_big_decimal.to_f,
    longitude: random_big_decimal.to_f,
  )
end

def build_air_now_measurement(opts = {})
  AirNow::Measurement.new(
    sensor_name: opts.fetch(:sensor_name, 'pm25'),
    value: opts.fetch(:value, random_float),
    latitude: random_big_decimal,
    longitude: random_big_decimal,
    time_local: random_date_time.change(usec: 0),
    time_utc: random_date_time.change(usec: 0),
    location: opts.fetch(:location, random_string),
  )
end
