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

  # The same contract as the AirBeam endpoint, so only the shape is re-pinned
  # here — the full code vocabulary is covered in
  # `spec/requests/fixed_stream_daily_averages_spec.rb`.
  describe 'invalid query parameters' do
    it 'answers 400 rather than an empty list when the dates are missing' do
      get '/api/v3/station_stream_daily_averages'

      expect(response.status).to eq(400)
      expect(JSON.parse(response.body)).to eq(
        'error_code' => 'validation_error',
        'message' => 'Query parameters are invalid',
        'fields' => {
          'stream_id' => [{ 'code' => 'missing', 'message' => 'is missing' }],
          'start_date' => [{ 'code' => 'missing', 'message' => 'is missing' }],
          'end_date' => [{ 'code' => 'missing', 'message' => 'is missing' }],
        },
      )
    end

    it 'answers 400 rather than a PG error when a date is unparseable' do
      get '/api/v3/station_stream_daily_averages',
          params: { stream_id: 1, start_date: 'abc', end_date: 'xyz' }

      expect(response.status).to eq(400)
      expect(JSON.parse(response.body)['fields'].keys).to match_array(%w[start_date end_date])
    end
  end
end
