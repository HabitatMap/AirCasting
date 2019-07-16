module TestUtils
  def create_session_with_streams_and_measurements!(attributes = {})
    session =
      create_session!(
        id: attributes.fetch(:id, rand(1_000_000)),
        contribute: attributes.fetch(:contribute, true),
        start_time_local: attributes.fetch(:start_time_local, DateTime.current),
        end_time_local: attributes.fetch(:end_time_local, DateTime.current),
        user: attributes.fetch(:user, create_user!)
      )
    stream = create_stream!(session: session)
    create_measurements!(
      stream: stream,
      value: attributes.fetch(:value, 1),
      count: attributes.fetch(:count, 1)
    )

    session
  end

  def create_session!(attributes = {})
    Session.create!(
      id: attributes.fetch(:id, rand(1_000_000)),
      title: attributes.fetch(:title, 'Example Session'),
      user: attributes.fetch(:user, create_user!),
      uuid: attributes.fetch(:uuid, "uuid#{rand}"),
      start_time: DateTime.current,
      start_time_local: attributes.fetch(:start_time_local, DateTime.current),
      end_time: DateTime.current,
      end_time_local: attributes.fetch(:end_time_local, DateTime.current),
      type: 'MobileSession',
      longitude: 1.0,
      latitude: 1.0,
      is_indoor: false,
      version: attributes.fetch(:version, 1),
      contribute: attributes.fetch(:contribute, true)
    )
  end

  def create_stream!(attributes = {})
    Stream.create!(
      sensor_package_name: 'AirBeam2:00189610719F',
      sensor_name: 'AirBeam2-F',
      measurement_type: 'Temperature',
      unit_name: 'Fahrenheit',
      session: attributes.fetch(:session, create_session!),
      measurement_short_type: 'dB',
      unit_symbol: 'dB',
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100,
      min_latitude: attributes.fetch(:min_latitude, 1),
      max_latitude: attributes.fetch(:max_latitude, 1),
      min_longitude: attributes.fetch(:min_longitude, 1),
      max_longitude: attributes.fetch(:max_longitude, 1)
    )
  end

  def create_measurement!(attributes = {})
    Measurement.create!(
      time: attributes.fetch(:time, DateTime.current),
      latitude: attributes.fetch(:latitude, 1),
      longitude: attributes.fetch(:longitude, 1),
      value: attributes.fetch(:value, 123),
      milliseconds: attributes.fetch(:milliseconds, 123),
      stream: attributes.fetch(:stream, create_stream!)
    )
  end

  def create_measurements!(attributes)
    attributes.fetch(:count, 1).times do |n|
      Measurement.create!(
        time: Time.current - n.minutes,
        latitude: 1,
        longitude: 1,
        value: attributes.fetch(:value, 1),
        milliseconds: 0,
        stream: attributes.fetch(:stream)
      )
    end
  end

  def create_old_measurements!(attributes)
    60.times do |n|
      Measurement.create!(
        time: Time.current - (61 + n).minutes,
        latitude: 1,
        longitude: 1,
        value: attributes.fetch(:value),
        milliseconds: 0,
        stream: attributes.fetch(:stream)
      )
    end
  end

  def create_user!(attributes = {})
    User.create!(
      id: attributes.fetch(:id, rand(100_000)),
      username: attributes.fetch(:username, "username#{rand}"),
      email: "email#{rand}@example.com",
      password: 'password',
      session_stopped_alert: attributes.fetch(:session_stopped_alert, false)
    )
  end
end

def create_note!(attributes = {})
  Note.create!(
    text: 'text',
    date: DateTime.current,
    latitude: 123,
    longitude: 123,
    session: attributes.fetch(:session),
    number: rand(100_000)
  )
end
