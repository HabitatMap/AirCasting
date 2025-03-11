require 'rails_helper'

describe SaveMeasurements do
  let!(:user) { create(:user, username: 'AirNow') }
  let(:air_now_stream) do
    AirNow::Stream.new(
      sensor_name: 'PM2.5',
      latitude: 50.06,
      longitude: 19.94,
      time_zone: 'Europe/Warsaw',
    )
  end
  let(:air_now_measurement) do
    AirNow::Measurement.new(
      value: 5,
      sensor_name: 'PM2.5',
      latitude: 50.06,
      longitude: 19.94,
      time_zone: 'Europe/Warsaw',
      time_local: Time.current,
      time_with_time_zone: Time.current.in_time_zone('Europe/Warsaw'),
    )
  end

  subject { described_class.new(user: user) }

  context 'when there is no session and stream persisted with given coordinates and sensor_name' do
    it 'creates a session, stream and measurement' do
      streams = { air_now_stream => [air_now_measurement] }

      expect { subject.call(streams: streams) }.to change {
          [Session.count, Stream.count, Measurement.count]
        }
        .from([0, 0, 0])
        .to([1, 1, 1])
    end
  end

  context 'when there is a session and stream persisted with the given coordinates and sensor_name' do
    it 'creates only a measurement' do
      threshold_set = create(:threshold_set, :air_now_pm2_5)
      session =
        create(:fixed_session, user: user, latitude: 50.06, longitude: 19.94)
      stream =
        create(
          :stream,
          session: session,
          threshold_set: threshold_set,
          min_latitude: 50.06,
          min_longitude: 19.94,
          sensor_name: 'Government-PM2.5',
        )

      streams = { air_now_stream => [air_now_measurement] }

      expect { subject.call(streams: streams) }.to change { Session.count }.by(
        0,
      ).and change { Stream.count }.by(0)

      measurement = Measurement.last
      expect(measurement.stream_id).to eq(stream.id)
    end

    context 'when given coordinates are within tolerance (round(3) precision)' do
      it 'creates only a measurement' do
        threshold_set = create(:threshold_set, :air_now_pm2_5)
        session =
          create(
            :fixed_session,
            user: user,
            latitude: 50.06 + 0.0001,
            longitude: 19.94 + 0.0001,
          )
        stream =
          create(
            :stream,
            session: session,
            threshold_set: threshold_set,
            min_latitude: 50.06 + 0.0001,
            min_longitude: 19.94 + 0.0001,
            sensor_name: 'Government-PM2.5',
          )

        streams = { air_now_stream => [air_now_measurement] }

        expect { subject.call(streams: streams) }.to change { Session.count }
          .by(0).and change { Stream.count }.by(0)

        measurement = Measurement.last
        expect(measurement.stream_id).to eq(stream.id)
      end
    end
  end
end
