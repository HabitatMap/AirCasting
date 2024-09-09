require 'rails_helper'

describe SaveMeasurements do
  let(:user) { create_user!(username: 'OpenAq') }
  subject { described_class.new(user: user) }

  context "when there is no session and stream persisted with the new stream's coordinates and sensor_name" do
    it 'creates a new session' do
      streams = {
        build_air_now_stream(sensor_name: 'PM2.5') => [build_air_now_measurement]
      }

      expect { subject.call(streams: streams) }.to change { Session.count }
        .from(0)
        .to(1)
    end

    it 'creates a new stream' do
      streams = {
        build_air_now_stream(sensor_name: 'PM2.5') => [build_air_now_measurement]
      }

      expect { subject.call(streams: streams) }.to change { Stream.count }
        .from(0)
        .to(1)
    end

    it 'creates a new measurement' do
      streams = {
        build_air_now_stream(sensor_name: 'PM2.5') => [build_air_now_measurement]
      }

      expect { subject.call(streams: streams) }.to change { Measurement.count }
        .from(0)
        .to(1)
    end
  end

  context "when there is a session and stream persisted with the new stream's coordinates and sensor_name" do
    it 'does not create a new session' do
      stream = build_air_now_stream(sensor_name: 'PM2.5')
      persisted_session =
        create_session!(latitude: stream.latitude, longitude: stream.longitude, type: 'FixedSession', user: user)
      persisted_stream =
        create_stream!(
          min_latitude: stream.latitude,
          max_latitude: stream.latitude,
          min_longitude: stream.longitude,
          max_longitude: stream.longitude,
          start_latitude: stream.latitude,
          start_longitude: stream.longitude,
          sensor_name: stream.sensor_name,
          session: persisted_session
        )
      measurement = build_air_now_measurement(location: persisted_session.title)
      streams = { stream => [measurement] }

      expect { subject.call(streams: streams) }.to_not change { Session.count }
    end

    it 'does not create a new stream' do
      stream = build_air_now_stream(sensor_name: 'PM2.5')
      persisted_session =
        create_session!(latitude: stream.latitude, longitude: stream.longitude, type: 'FixedSession', user: user)
      persisted_stream =
        create_stream!(
          min_latitude: stream.latitude,
          max_latitude: stream.latitude,
          min_longitude: stream.longitude,
          max_longitude: stream.longitude,
          start_latitude: stream.latitude,
          start_longitude: stream.longitude,
          sensor_name: stream.sensor_name,
          session: persisted_session
        )
      measurement = build_air_now_measurement
      streams = { stream => [measurement] }

      expect { subject.call(streams: streams) }.to_not change { Stream.count }
    end

    it 'does not create a new session when coordinates are within tolerance' do
      stream = build_air_now_stream(sensor_name: 'PM2.5')
      persisted_session =
        create_session!(latitude: stream.latitude, longitude: stream.longitude, type: 'FixedSession', user: user)
      persisted_stream =
        create_stream!(
          min_latitude: stream.latitude,
          max_latitude: stream.latitude,
          min_longitude: stream.longitude + 0.0001,
          max_longitude: stream.longitude + 0.0001,
          start_latitude: stream.latitude,
          start_longitude: stream.longitude,
          sensor_name: stream.sensor_name,
          session: persisted_session
        )
      measurement = build_air_now_measurement
      streams = { stream => [measurement] }

      expect { subject.call(streams: streams) }.to_not change { Session.count }
    end
  end
end
