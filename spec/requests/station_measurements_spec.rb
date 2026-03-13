require 'rails_helper'

describe 'GET /api/v3/station_measurements' do
  it 'returns only measurements in the given time range and stream' do
    config = create(:stream_configuration)
    station_stream = create(:station_stream, stream_configuration: config)
    measurement_1 =
      create(
        :station_measurement,
        station_stream: station_stream,
        value: 10.0,
        measured_at: Time.zone.parse('2023-01-01T10:00:00Z'),
      )
    measurement_2 =
      create(
        :station_measurement,
        station_stream: station_stream,
        value: 20.0,
        measured_at: Time.zone.parse('2023-01-01T11:00:00Z'),
      )
    create(
      :station_measurement,
      station_stream: station_stream,
      value: 99.0,
      measured_at: Time.zone.parse('2023-01-01T08:00:00Z'),
    )
    other_stream = create(:station_stream, stream_configuration: config)
    create(
      :station_measurement,
      station_stream: other_stream,
      value: 123.0,
      measured_at: Time.zone.parse('2023-01-01T10:30:00Z'),
    )

    expected_response = [
      { 'value' => 10.0, 'time' => measurement_1.measured_at.to_i * 1_000 },
      { 'value' => 20.0, 'time' => measurement_2.measured_at.to_i * 1_000 },
    ]

    params = {
      station_stream_id: station_stream.id.to_s,
      start_time: measurement_1.measured_at.to_f * 1000,
      end_time: measurement_2.measured_at.to_f * 1000,
    }

    get '/api/v3/station_measurements', params: params

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to match_array(expected_response)
  end

  it 'returns 400 when station_stream_id is missing' do
    get '/api/v3/station_measurements',
        params: {
          start_time: 1_000_000.0,
          end_time: 2_000_000.0,
        }

    expect(response).to have_http_status(:bad_request)
  end

  it 'returns 400 when end_time is not greater than start_time' do
    station_stream = create(:station_stream)

    get '/api/v3/station_measurements',
        params: {
          station_stream_id: station_stream.id.to_s,
          start_time: 2_000_000.0,
          end_time: 1_000_000.0,
        }

    expect(response).to have_http_status(:bad_request)
  end
end
