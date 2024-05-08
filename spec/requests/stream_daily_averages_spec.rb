require 'rails_helper'

describe 'GET api/v3/stream_daily_averages' do
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

    expected_response = [
      {
        date: stream_daily_average_1.date.strftime('%Y-%m-%d'),
        value: stream_daily_average_1.value.round,
      },
      {
        date: stream_daily_average_2.date.strftime('%Y-%m-%d'),
        value: stream_daily_average_2.value.round,
      }
    ]

    get "/api/v3/stream_daily_averages/#{stream.id}?start_date=#{Date.current.prev_day}&end_date=#{Date.current}"

    expect(response.status).to eq(200)
    expect(JSON.parse(response.body)).to eq(expected_response.as_json)
  end

  it 'returns not_found status' do
    get '/api/v3/stream_daily_averages/1?start_date=2021-01-01&end_date=2021-01-02'

    expect(response.status).to eq(404)
  end
end
