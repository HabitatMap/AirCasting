require "rails_helper"

 describe FixedRegionInfo do
   it "calculates average, number of contributors and number of samples for sessions for given stream for last hour" do
    user1 = create_user!(id: 1)
    user2 = create_user!(id: 2)
    session1 = create_session_with_streams_and_measurements!(id: 1, value: 1, user: user1, count: 60)
    session2 = create_session_with_streams_and_measurements!(id: 2, value: 2, user: user2, count: 60)

    data = {
      session_ids: [session1.id, session2.id],
      sensor_name: "AirBeam2-F",
    }

    region_info = FixedRegionInfo.new.call(data)

    expect(region_info[:average]).to eq(1.5)
    expect(region_info[:number_of_contributors]).to eq(2)
    expect(region_info[:number_of_samples]).to eq(120)
    expect(region_info[:number_of_instruments]).to eq(2)
  end

  it "doesn't take into account measurements older than one hour" do
    user1 = create_user!(id: 1)
    user2 = create_user!(id: 2)
    session1 = create_session_with_streams_and_measurements!(id: 1, value: 1, user: user1, count: 60)
    session2 = create_session!(id: 2, user: user2)
    stream = create_stream!(session: session2)
    create_measurements!(value: 2, stream: stream, count: 60)
    create_old_measurements!(value: 20, stream: stream)

    data = {
      session_ids: [session1.id, session2.id],
      sensor_name: "AirBeam2-F",
    }

    region_info = FixedRegionInfo.new.call(data)

    expect(region_info[:average]).to eq(1.5)
    expect(region_info[:number_of_contributors]).to eq(2)
    expect(region_info[:number_of_samples]).to eq(120)
    expect(region_info[:number_of_instruments]).to eq(2)
  end
end

 private

 def create_session_with_streams_and_measurements!(attributes)
  session = create_session!(id: attributes.fetch(:id), user: attributes.fetch(:user))
  stream = create_stream!(session: session, min_latitude: attributes.fetch(:min_latitude, 1.0), max_latitude: attributes.fetch(:max_latitude, 1.0), min_longitude: attributes.fetch(:min_longitude, 1.0), max_longitude: attributes.fetch(:max_longitude, 1.0))
  create_measurements!(stream: stream, value: attributes.fetch(:value), count: attributes.fetch(:count))

   session
end

 def create_session!(attributes)
  Session.create!(
    title: "Example Session",
    user: attributes.fetch(:user),
    uuid: "845342a6-f9f4-4835-86b3-b100163ec39#{attributes.fetch(:id)}",
    start_time: DateTime.current,
    start_time_local: DateTime.current,
    end_time: DateTime.current,
    end_time_local: DateTime.current,
    type: "FixedSession",
    longitude: 1.0,
    latitude: 1.0,
    is_indoor: false
  )
end

 def create_stream!(attributes)
  Stream.create!(
    sensor_package_name: "AirBeam2:00189610719F",
    sensor_name: "AirBeam2-F",
    measurement_type: "Temperature",
    unit_name: "Fahrenheit",
    session: attributes.fetch(:session),
    measurement_short_type: "dB",
    unit_symbol: "dB",
    threshold_very_low: 20,
    threshold_low: 60,
    threshold_medium: 70,
    threshold_high: 80,
    threshold_very_high: 100,
    min_latitude: attributes.fetch(:min_latitude, 1.0),
    max_latitude: attributes.fetch(:max_latitude, 1.0),
    min_longitude: attributes.fetch(:min_longitude, 1.0),
    max_longitude: attributes.fetch(:max_longitude, 1.0)
  )
end

 def create_measurements!(attributes)
  attributes.fetch(:count).times do |n|
    Measurement.create!(
      time: Time.current - n.minutes,
      latitude: 1,
      longitude: 1,
      value: attributes.fetch(:value),
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

 def create_user!(attributes)
  User.create!(
    username: "Test User#{attributes.fetch(:id)}",
    email: "email#{attributes.fetch(:id)}@example.com",
    password: "password"
  )
end
