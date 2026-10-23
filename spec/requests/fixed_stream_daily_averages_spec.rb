require 'rails_helper'

describe 'GET api/v3/fixed_stream_daily_averages' do
  it 'returns fixed stream data' do
    session = create_fixed_session!
    stream = create_stream!({ session: session })
    stream_daily_average_1 = create_stream_daily_average!(
      { stream: stream, date: Date.current, value: 10 }
    )
    stream_daily_average_2 = create_stream_daily_average!(
      { stream: stream, date: Date.current.prev_day, value: 9 }
    )
    expected_response = [
      { date: stream_daily_average_1.date.strftime('%Y-%m-%d'), value: stream_daily_average_1.value.round },
      { date: stream_daily_average_2.date.strftime('%Y-%m-%d'), value: stream_daily_average_2.value.round },
    ]
    get "/api/v3/fixed_stream_daily_averages?stream_id=#{stream.id}&start_date=#{Date.current.prev_day}&end_date=#{Date.current}"
    expect(response.status).to eq(200)
    expect(JSON.parse(response.body)).to match_array(expected_response.as_json)
  end

  it 'returns an empty array where there is no data found' do
    get '/api/v3/fixed_stream_daily_averages?stream_id=1&start_date=2021-01-01&end_date=2021-01-02'
    expect(JSON.parse(response.body)).to eq([])
  end

  # Before the contract, both dates went straight into `date >= ? AND date <= ?`.
  describe 'invalid query parameters' do
    it 'answers 400 rather than an empty list when the dates are missing' do
      get '/api/v3/fixed_stream_daily_averages'

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
      get '/api/v3/fixed_stream_daily_averages',
          params: { stream_id: 1, start_date: 'abc', end_date: 'xyz' }

      expect(response.status).to eq(400)
      expect(JSON.parse(response.body)['fields']).to eq(
        'start_date' => [{ 'code' => 'not_a_date', 'message' => 'must be a date' }],
        'end_date' => [{ 'code' => 'not_a_date', 'message' => 'must be a date' }],
      )
    end

    it 'rejects a range that ends before it starts' do
      get '/api/v3/fixed_stream_daily_averages',
          params: { stream_id: 1, start_date: '2026-02-01', end_date: '2026-01-01' }

      expect(response.status).to eq(400)
      expect(JSON.parse(response.body)['fields']).to eq(
        'end_date' => [
          { 'code' => 'greater_than_or_equal_to',
            'message' => 'must be greater than or equal to start_date',
            'params' => { 'other' => 'start_date' } },
        ],
      )
    end

    it 'accepts a single-day range' do
      get '/api/v3/fixed_stream_daily_averages',
          params: { stream_id: 1, start_date: '2026-01-01', end_date: '2026-01-01' }

      expect(response.status).to eq(200)
    end

    # What the calendar page actually sends: `start_date` is the session's
    # `start_time`, an ISO 8601 datetime, not a plain date.
    it 'accepts an ISO 8601 datetime where a date is expected' do
      get '/api/v3/fixed_stream_daily_averages',
          params: { stream_id: 1, start_date: '2026-01-01T10:00:00.000Z', end_date: '2026-02-01' }

      expect(response.status).to eq(200)
    end
  end
end
