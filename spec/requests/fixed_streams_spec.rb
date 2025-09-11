require 'rails_helper'

describe 'GET api/v3/fixed_streams/:id' do
  it 'returns fixed stream data' do
    session = create(:fixed_session, last_measurement_at: Time.current)
    stream = create(:stream, session: session)
    measurement_1 = create(:fixed_measurement, stream: stream)
    measurement_2 = create(:fixed_measurement, stream: stream)

    stream_daily_average_1 =
      create(
        :stream_daily_average,
        stream: stream,
        date: Date.current,
        value: 10,
      )
    stream_daily_average_2 =
      create(
        :stream_daily_average,
        stream: stream,
        date: Date.current.prev_day,
        value: 9,
      )

    expected_response = {
      stream: {
        session_id: session.id,
        active: session.is_active,
        title: session.title,
        latitude: session.latitude,
        longitude: session.longitude,
        profile: session.username,
        sensor_name: stream.sensor_name,
        unit_symbol: stream.unit_symbol,
        update_frequency: '1 minute',
        last_update: stream.session.last_measurement_at,
        start_time: stream.session.start_time_local,
        end_time: stream.session.end_time_local,
        high: stream.threshold_set.threshold_high,
        max: stream.threshold_set.threshold_very_high,
        middle: stream.threshold_set.threshold_medium,
        low: stream.threshold_set.threshold_low,
        min: stream.threshold_set.threshold_very_low,
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

    get "/api/v3/fixed_streams/#{stream.id}"

    expect(response.status).to eq(200)
    expect(JSON.parse(response.body)).to eq(expected_response.as_json)
  end
end
