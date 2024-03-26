user =
  User.find_by(username: 'Jim Air', email: 'jim@test.com') ||
    User.create!(username: 'Jim Air', email: 'jim@test.com', password: '123456')

session = Session.find_by(user: user, title: 'Krakow session')

unless session
  latitude = 50.04
  longitude = 19.94
  s =
    Session.create!(
      user: user,
      title: 'Krakow session',
      start_time_local: Time.current - 4.months,
      end_time_local: Time.current,
      last_measurement_at: Time.current,
      type: 'FixedSession',
      latitude: latitude,
      longitude: longitude,
      uuid: '123',
      is_indoor: false,
    )

  stream =
    Stream.create!(
      session: s,
      sensor_name: 'PurpleAir-PM2.5',
      unit_name: 'microgram per cubic meter',
      measurement_type: 'Particulate Matter',
      measurement_short_type: 'PM',
      unit_symbol: 'µg/m³',
      threshold_very_low: 0,
      threshold_low: 12,
      threshold_medium: 35,
      threshold_high: 55,
      threshold_very_high: 150,
      sensor_package_name: 'PurpleAir-PM2.5',
      measurements_count: 20,
      average_value: 10.5,
    )

  time = s.start_time_local
  current_date = Date.current
  factory = RGeo::Geographic.spherical_factory(srid: 4326)
  while time < current_date
    Measurement.create!(
      stream: stream,
      time: time,
      time_with_time_zone: time.in_time_zone('Europe/Warsaw'),
      value: (0..10).to_a.sample,
      latitude: latitude,
      longitude: longitude,
      location: factory.point(longitude, latitude),
    )
    time = time + 1.hour
  end

  # time = s.start_time_local
  # while time < current_date
  #   StreamDailyAverage.create!(stream: stream, date: time, value: 9.5)
  #   time = time + 1.day
  # end
end
