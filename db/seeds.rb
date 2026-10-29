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
      # Same scale as AirBeam-PM2.5 — one pollutant, one colour scale.
      threshold_low: 9,
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

# Canonical default sets, one per sensor the server knows. These are what
# MobileSessions::Creator / FixedSessions::Creator assign when a client omits
# `thresholds`, and what GET /api/v3/threshold_sets serves. PM1/PM2.5 `low` is
# 9 (the 2024 EPA annual standard), matching production — the AirBeam3 and
# Mini V1 firmware still report 12 over BLE and cannot be updated.
#
# Keyed on (sensor_name, unit_symbol) and updated in place, not matched on the
# whole row: re-seeding after a band changes must correct the existing default,
# never leave two rows both flagged `is_default`.
[
  ['AirBeam-PM10',     'µg/m³', [0.0, 20.0, 50.0, 100.0, 200.0]],
  ['AirBeam-PM2.5',    'µg/m³', [0.0,  9.0, 35.0,  55.0, 150.0]],
  ['AirBeam-PM1',      'µg/m³', [0.0,  9.0, 35.0,  55.0, 150.0]],
  ['AirBeam-RH',       '%',     [0.0, 25.0, 50.0,  75.0, 100.0]],
  ['AirBeam-F',        'F',    [15.0, 45.0, 75.0, 105.0, 135.0]],
  # Phone microphone — an officially supported session type, so it gets a
  # default set like the AirBeam sensors. Values match what both apps ship.
  ['Phone Microphone', 'dB',   [20.0, 60.0, 70.0,  80.0, 100.0]],
].each do |sensor_name, unit_symbol, bands|
  very_low, low, medium, high, very_high = bands

  ThresholdSet
    .find_or_initialize_by(sensor_name: sensor_name, unit_symbol: unit_symbol, is_default: true)
    .update!(
      threshold_very_low: very_low,
      threshold_low: low,
      threshold_medium: medium,
      threshold_high: high,
      threshold_very_high: very_high,
    )
end

# Per-device threshold sets. Streams are stored under the raw device sensor
# name (AirBeam2-*/AirBeam3-*/AirBeamMini-*) and Stream.thresholds looks them
# up by that name, so seed them to match real servers and avoid nil lookups
# when rendering fixed streams locally.
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam2-PM10', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 20.0, threshold_medium: 50.0, threshold_high: 100.0, threshold_very_high: 200.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam2-PM2.5', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam2-PM1', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam2-RH', unit_symbol: '%', threshold_very_low: 0.0, threshold_low: 25.0, threshold_medium: 50.0, threshold_high: 75.0, threshold_very_high: 100.0, is_default: true)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam2-F', unit_symbol: 'F', threshold_very_low: 15.0, threshold_low: 45.0, threshold_medium: 75.0, threshold_high: 105.0, threshold_very_high: 135.0, is_default: true)

ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam3-PM10', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 20.0, threshold_medium: 50.0, threshold_high: 100.0, threshold_very_high: 200.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam3-PM2.5', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam3-PM1', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam3-RH', unit_symbol: '%', threshold_very_low: 0.0, threshold_low: 25.0, threshold_medium: 50.0, threshold_high: 75.0, threshold_very_high: 100.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeam3-F', unit_symbol: 'F', threshold_very_low: 15.0, threshold_low: 45.0, threshold_medium: 75.0, threshold_high: 105.0, threshold_very_high: 135.0, is_default: false)

ThresholdSet.find_or_create_by!(sensor_name: 'AirBeamMini-PM10', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 20.0, threshold_medium: 50.0, threshold_high: 100.0, threshold_very_high: 200.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³', threshold_very_low: 0.0, threshold_low: 12.0, threshold_medium: 35.0, threshold_high: 55.0, threshold_very_high: 150.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeamMini-RH', unit_symbol: '%', threshold_very_low: 0.0, threshold_low: 25.0, threshold_medium: 50.0, threshold_high: 75.0, threshold_very_high: 100.0, is_default: false)
ThresholdSet.find_or_create_by!(sensor_name: 'AirBeamMini-F', unit_symbol: 'F', threshold_very_low: 15.0, threshold_low: 45.0, threshold_medium: 75.0, threshold_high: 105.0, threshold_very_high: 135.0, is_default: false)

Source.find_or_create_by!(name: 'AirBeam')
