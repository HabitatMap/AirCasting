require 'rails_helper'

describe 'GET /api/v3/fixed_measurements' do
  it 'returns only measurements in the given time range and stream' do
    stream = create(:stream)
    measurement_1 =
      create(
        :fixed_measurement,
        stream: stream,
        value: 10.0,
        time: Time.zone.parse('2023-01-01T10:00:00Z'),
        time_with_time_zone: Time.zone.parse('2023-01-01T10:00:00Z'),
      )
    measurement_2 =
      create(
        :fixed_measurement,
        stream: stream,
        value: 20.0,
        time: Time.zone.parse('2023-01-01T11:00:00Z'),
        time_with_time_zone: Time.zone.parse('2023-01-01T11:00:00Z'),
      )
    measurement_not_in_range =
      create(
        :fixed_measurement,
        stream: stream,
        value: 99.0,
        time: Time.zone.parse('2023-01-01T08:00:00Z'),
        time_with_time_zone: Time.zone.parse('2023-01-01T08:00:00Z'),
      )
    other_stream = create(:stream)
    measurement_other_stream =
      create(
        :fixed_measurement,
        stream: other_stream,
        value: 123.0,
        time: Time.zone.parse('2023-01-01T10:30:00Z'),
        time_with_time_zone: Time.zone.parse('2023-01-01T10:30:00Z'),
      )

    expected_response = [
      { 'value' => 10.0, 'time' => measurement_1.time.to_i * 1_000 },
      { 'value' => 20.0, 'time' => measurement_2.time.to_i * 1_000 },
    ]

    params = {
      stream_id: stream.id.to_s,
      start_time: measurement_1.time.to_f * 1000,
      end_time: measurement_2.time.to_f * 1000,
    }

    get '/api/v3/fixed_measurements', params: params

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to match_array(expected_response)
  end
end
