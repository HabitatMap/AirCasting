require 'rails_helper'

describe 'GET api/v3/station_stream_daily_averages' do
  it 'returns station stream daily averages data' do
    station_stream = create(:station_stream)
    station_stream_daily_average_1 = create(
      :station_stream_daily_average,
      station_stream: station_stream,
      date: Date.current,
      value: 10,
    )
    station_stream_daily_average_2 = create(
      :station_stream_daily_average,
      station_stream: station_stream,
      date: Date.current.prev_day,
      value: 9,
    )
    expected_response = [
      { date: station_stream_daily_average_1.date.strftime('%Y-%m-%d'), value: station_stream_daily_average_1.value.round },
      { date: station_stream_daily_average_2.date.strftime('%Y-%m-%d'), value: station_stream_daily_average_2.value.round },
    ]
    get "/api/v3/station_stream_daily_averages?stream_id=#{station_stream.id}&start_date=#{Date.current.prev_day}&end_date=#{Date.current}"
    expect(response.status).to eq(200)
    expect(JSON.parse(response.body)).to match_array(expected_response.as_json)
  end

  it 'returns an empty array where there is no data found' do
    get '/api/v3/station_stream_daily_averages?stream_id=1&start_date=2021-01-01&end_date=2021-01-02'
    expect(JSON.parse(response.body)).to eq([])
  end
end
