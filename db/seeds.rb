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

  threshold_set =
    ThresholdSet.create!(
      threshold_very_low: 0,
      threshold_low: 12,
      threshold_medium: 35,
      threshold_high: 55,
      threshold_very_high: 150,
      unit_symbol: 'µg/m³',
      sensor_name: 'Government-PM2.5',
    )

  stream =
    Stream.create!(
      session: s,
      sensor_name: 'Government-PM2.5',
      unit_name: 'microgram per cubic meter',
      measurement_type: 'Particulate Matter',
      measurement_short_type: 'PM',
      unit_symbol: 'µg/m³',
      threshold_set_id: threshold_set.id,
      sensor_package_name: 'Government-PM2.5',
      measurements_count: 20,
      average_value: 10.5,
    )

  time = s.start_time_local
  factory = RGeo::Geographic.spherical_factory(srid: 4326)
  (1..20).each do |value|
    Measurement.create!(
      stream: stream,
      time: time,
      value: value,
      latitude: latitude,
      longitude: longitude,
      location: factory.point(longitude, latitude),
    )
    time = time + 1.hour
  end

  time = s.start_time_local
  current_date = Date.current
  while time < current_date
    StreamDailyAverage.create!(stream: stream, date: time, value: 9.5)
    time = time + 1.day
  end
end

ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam-PM10', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 20.0, threshold_medium: 50.0, threshold_high: 100.0, threshold_very_high: 200.0, is_default: true)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam-PM2.5', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: true)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam-PM1', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: true)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam-RH', unit_symbol: '%', threshold_very_low: 0.0, threshold_low: 25.0, threshold_medium: 50.0, threshold_high: 75.0, threshold_very_high: 100.0, is_default: true)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam-F', unit_symbol: 'F', threshold_very_low: 15.0, threshold_low: 45.0, threshold_medium: 75.0, threshold_high: 105.0, threshold_very_high: 135.0, is_default: true)
