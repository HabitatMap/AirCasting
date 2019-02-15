require "spec_helper"

describe FixedRegionInfo do
  it "calculates average, number of contributors, top contributors and number of samples for sessions for given stearm" do
    session1 = create_session_with_stearms_and_measurements!({ id: 1, longitude: 1.0, latitude: 1.0, value: 1 })
    session2 = create_session_with_stearms_and_measurements!({ id: 2, longitude: 1.0, latitude: 1.0, value: 2 })

    data = {
      session_ids: [session1.id, session2.id],
      sensor_name: "AirBeam2-F",
    }

    region_info = FixedRegionInfo.new.call(data)

    expect(region_info).to eq({
        average: 1.5,
        number_of_contributors: 2,
        top_contributors: (["Test User1", "Test User2"]),
        number_of_samples: 120,
        number_of_instruments: 2,
      })
  end
end

private

def create_session_with_stearms_and_measurements!(attributes)
  session = create_session!({
    id: attributes.fetch(:id),
    longitude: attributes.fetch(:longitude),
    latitude: attributes.fetch(:latitude),
  })
  stream = create_stream!({ session: session })
  create_measurements!({ stream: stream, value: attributes.fetch(:value) })

  session
end

def create_session!(attributes)
  Session.create!(
    title: "Example Session",
    user: create_user!({id: attributes.fetch(:id)}),
    uuid: "845342a6-f9f4-4835-86b3-b100163ec39#{attributes.fetch(:id)}",
    start_time: DateTime.current,
    start_time_local: DateTime.current,
    end_time: DateTime.current,
    end_time_local: DateTime.current,
    type: "FixedSession",
    longitude: attributes.fetch(:longitude),
    latitude: attributes.fetch(:latitude)
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
    threshold_very_high: 100
  )
end

def create_measurements!(attributes)
  60.times do |n|
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

def create_user!(attributes)
  User.create!(
    username: "Test User#{attributes.fetch(:id)}",
    email: "email#{attributes.fetch(:id)}@example.com",
    password: "password"
  )
end
