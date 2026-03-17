require 'rails_helper'

describe 'GET /api/v3/station_streams/export' do
  it 'schedules an export and returns 200' do
    station_stream = create(:station_stream)
    allow(ExportStationStreamsWorker).to receive(:perform_async)

    get '/api/v3/station_streams/export',
        params: { station_stream_id: station_stream.id, email: 'user@example.com' }

    expect(response).to have_http_status(:ok)
    expect(ExportStationStreamsWorker).to have_received(:perform_async).with(
      station_stream.id,
      'user@example.com',
    )
  end

  it 'returns 400 when email is missing' do
    station_stream = create(:station_stream)

    get '/api/v3/station_streams/export',
        params: { station_stream_id: station_stream.id }

    expect(response).to have_http_status(:bad_request)
  end

  it 'returns 400 when station_stream_id is missing' do
    get '/api/v3/station_streams/export',
        params: { email: 'user@example.com' }

    expect(response).to have_http_status(:bad_request)
  end
end
