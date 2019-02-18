require "spec_helper"

describe FixedAverageInfo do
  it "for two sessions in the same location creates json with one rectangle" do
    session1 = create_session_with_stearms_and_measurements!({ id: 1, longitude: 1.0, latitude: 1.0, value: 1 })
    session2 = create_session_with_stearms_and_measurements!({ id: 2, longitude: 1.0, latitude: 1.0, value: 2 })

    data = {
      :west=> 0.0,
      :east=> 2.0,
      :south=> 0.0,
      :north=> 2.0,
      :grid_size_x=>50,
      :grid_size_y=>25,
      :sensor_name=>"AirBeam2-F",
      :session_ids=>[session1.id, session2.id]
    }

    averages_json = FixedAverageInfo.new(data).as_json

    expect(averages_json).to eq([{
        :value=>1.5,
        :east=>1.02,
        :west=>0.98,
        :north=>1.0142552583569997,
        :south=>0.9331148376884397,
      }])
  end

  it "counts average only based on last hour measurements" do
    session1 = create_session_with_stearms_and_measurements!({ id: 1, longitude: 1.0, latitude: 1.0, value: 1 })
    session2 = create_session({ id: 2, longitude: 1.0, latitude: 1.0 })
    stream = create_stream!({session: session2})
    create_measurements!({ value: 2, stream: stream })
    create_old_measurements!({ value: 20, stream: stream })

    data = {
      :west=> 0.0,
      :east=> 2.0,
      :south=> 0.0,
      :north=> 2.0,
      :grid_size_x=>50,
      :grid_size_y=>25,
      :sensor_name=>"AirBeam2-F",
      :session_ids=>[session1.id, session2.id]
    }

    averages_json = FixedAverageInfo.new(data).as_json

    expect(averages_json).to eq([{
        :value=>1.5,
        :east=>1.02,
        :west=>0.98,
        :north=>1.0142552583569997,
        :south=>0.9331148376884397,
      }])
  end

  it "for two sessions in close location creates json with one rectangle" do
    session1 = create_session_with_stearms_and_measurements!({ id: 1, longitude: 1.0, latitude: 1.0, value: 1 })
    session2 = create_session_with_stearms_and_measurements!({ id: 2, longitude: 1.01, latitude: 1.01, value: 2 })

    data = {
      :west=> 0.0,
      :east=> 2.0,
      :south=> 0.0,
      :north=> 2.0,
      :grid_size_x=>50,
      :grid_size_y=>25,
      :sensor_name=>"AirBeam2-F",
      :session_ids=>[session1.id, session2.id]
    }

    averages_json = FixedAverageInfo.new(data).as_json

    expect(averages_json).to eq([{
        :value=>1.5,
        :east=>1.02,
        :west=>0.98,
        :north=>1.0142552583569997,
        :south=>0.9331148376884397,
      }])
  end

  it "for multiple sessions create json with sessions divided the into rectangles base on location" do
    session1 = create_session_with_stearms_and_measurements!({ id: 1, longitude: 1.0, latitude: 1.0, value: 1 })
    session2 = create_session_with_stearms_and_measurements!({ id: 2, longitude: 1.0, latitude: 1.0, value: 2 })
    session3 = create_session_with_stearms_and_measurements!({ id: 3, longitude: 5.0, latitude: 5.0, value: 100})
    session4 = create_session_with_stearms_and_measurements!({ id: 4, longitude: 5.01, latitude: 5.01, value: 150})

    data = {
      :west=> 0.0,
      :east=> 6.0,
      :south=> 0.0,
      :north=> 6.0,
      :grid_size_x=>50,
      :grid_size_y=>25,
      :sensor_name=>"AirBeam2-F",
      :session_ids=>[session1.id, session2.id, session3.id, session4.id]
    }

    averages_json = FixedAverageInfo.new(data).as_json

    expect(averages_json).to eq([{
        :value=>1.5,
        :east=>1.02,
        :west=>0.8999999999999999,
        :north=>1.090277990413152,
        :south=>0.8479939925435627,
      },{
        :value=>125.0,
        :east=>5.1,
        :west=>4.98,
        :north=>5.209105954196171,
        :south=>4.966821956326581,
      }])
  end
end

private

def create_session_with_stearms_and_measurements!(attributes)
  session = create_session({
    id: attributes.fetch(:id),
    longitude: attributes.fetch(:longitude),
    latitude: attributes.fetch(:latitude),
  })
  stream = create_stream!({ session: session })
  create_measurements!({ stream: stream, value: attributes.fetch(:value) })

  session
end

def create_session(attributes)
  Session.create!(
    title: "Example Session",
    user: User.new,
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
