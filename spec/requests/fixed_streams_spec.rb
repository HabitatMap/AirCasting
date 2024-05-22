require 'rails_helper'

describe 'GET api/v3/fixed_streams/:id' do
  context 'calendar feature enabled' do
    it 'returns fixed stream data' do
      session = create_fixed_session!
      stream = create_stream!({ session: session })
      measurement_1 = create_measurement!({ stream: stream })
      measurement_2 = create_measurement!({ stream: stream })
      stream_daily_average_1 =
        create_stream_daily_average!(
          { stream: stream, date: Date.current, value: 10 },
        )
      stream_daily_average_2 =
        create_stream_daily_average!(
          { stream: stream, date: Date.current.prev_day, value: 9 },
        )

      expected_response = {
        stream: {
          id: stream.id,
          session_id: session.id,
          active: session.is_active,
          title: session.title,
          profile: session.username,
          sensor_name: stream.sensor_name,
          unit_symbol: stream.unit_symbol,
          update_frequency: '1 minute',
          last_update: stream.session.last_measurement_at,
          start_time: session.end_time_local,
          end_time: session.start_time_local,
        },
        measurements: [
          { time: measurement_1.time.to_i * 1_000, value: measurement_1.value },
          { time: measurement_2.time.to_i * 1_000, value: measurement_2.value },
        ],
        stream_daily_averages: [
          {
            date: stream_daily_average_1.date.strftime('%Y-%m-%d'),
            value: stream_daily_average_1.value.round,
          },
          {
            date: stream_daily_average_2.date.strftime('%Y-%m-%d'),
            value: stream_daily_average_2.value.round,
          },
        ],
      }

      expect(Flipper).to receive(:enabled?).with(:calendar).and_return(true)

      get "/api/v3/fixed_streams/#{stream.id}"

      expect(response.status).to eq(200)
      expect(JSON.parse(response.body)).to eq(expected_response.as_json)
    end
  end

  context 'calendar feature disabled' do
    it 'returns not_found status' do
      expect(Flipper).to receive(:enabled?).with(:calendar).and_return(false)

      get '/api/v3/fixed_streams/1'

      expect(response.status).to eq(404)
    end
  end
end
