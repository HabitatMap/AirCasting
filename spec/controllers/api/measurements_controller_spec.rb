require 'rails_helper'

describe Api::MeasurementsController do
  context 'without pagination' do
    describe '#index' do
      it 'returns measurements json' do
        user = create_user!
        session = create_session!(user: user)
        stream = create_stream!(session: session)
        time = DateTime.new(2_000, 10, 1, 2, 3, 4)
        latitude = 1.1
        longitude = 2.2
        value = 1.0
        create_measurement!(
          stream: stream,
          value: value,
          latitude: latitude,
          longitude: longitude,
          time: time,
        )

        get :index, params: { stream_ids: "#{stream.id}" }

        expected = [
          {
            'latitude' => latitude,
            'longitude' => longitude,
            'time' => 970_365_784_000,
            'value' => value,
          },
        ]

        expect(json_response).to eq(expected)
      end
    end
  end

  context 'with pagination' do
    describe '#index' do
      it 'returns a page of measurements in json' do
        user = create_user!
        time_zone = 'America/Los_Angeles'
        session = create_session!(user: user, time_zone: time_zone)
        stream = create_stream!(session: session)
        time = DateTime.new(2_000, 10, 1, 2, 3, 4)
        latitude = 1.1
        longitude = 2.2
        value = 1.0
        create_measurement!(
          stream: stream,
          value: value - 2,
          latitude: latitude - 2,
          longitude: longitude - 2,
          time: time - 2,
          time_with_time_zone: (time - 2).in_time_zone(time_zone),
        )
        create_measurement!(
          stream: stream,
          value: value,
          latitude: latitude,
          longitude: longitude,
          time: time,
          time_with_time_zone: (time).in_time_zone(time_zone),
        )
        create_measurement!(
          stream: stream,
          value: value + 2,
          latitude: latitude + 2,
          longitude: longitude + 2,
          time: time + 2,
          time_with_time_zone: (time + 2).in_time_zone(time_zone),
        )

        get :index,
            params: {
              stream_ids: "#{stream.id}",
              start_time: (time - 1).to_datetime.strftime('%Q').to_i,
              end_time: (time + 1).to_datetime.strftime('%Q').to_i,
            }

        expected = [
          {
            'latitude' => latitude,
            'longitude' => longitude,
            'time' => 970_365_784_000,
            'value' => value,
          },
        ]

        expect(json_response).to eq(expected)
      end
    end
  end
end
