require 'rails_helper'

describe 'GET /g/:url_token', type: :request do
  let(:source) { create(:source, name: 'EPA', full_name: 'US EPA AirNow') }
  let(:pm) { create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³') }

  def station_stream(**station_attributes)
    station = create(:station, source: source, url_token: 'ab3k9', **station_attributes)
    create(
      :station_stream,
      source: source,
      station: station,
      stream_configuration: pm,
      location: station.location,
    )
  end

  it 'redirects to the map, opened on the named stream' do
    stream = station_stream

    get '/g/ab3k9?sensor_name=Government-PM2.5'

    expect(response).to have_http_status(:found)
    params = CGI.parse(URI.parse(response.location).query)
    expect(params).to include(
      'streamId' => [stream.id.to_s],
      'sensorName' => ['Government-PM2.5'],
      'measurementType' => ['Particulate Matter'],
    )
  end

  it 'answers 404 for a token no station holds' do
    station_stream

    get '/g/nope1?sensor_name=Government-PM2.5'

    expect(response).to have_http_status(:not_found)
  end

  it 'answers 404 for an excluded station' do
    station_stream(excluded_reason: Station::EXCLUDED_REASONS[:temporary])

    get '/g/ab3k9?sensor_name=Government-PM2.5'

    expect(response).to have_http_status(:not_found)
  end

  # The route carries `query_string: /.+/` for the same reason `/s/` does: the
  # web shows one stream at a time, so a bare token has nothing to open. It
  # falls past the constraint to the `*path` catch-all and gets the SPA, the
  # same as a bare `/s/` token -- no redirect, and nothing leaked about whether
  # the token names a station.
  it 'does not resolve a bare token' do
    station_stream

    get '/g/ab3k9'

    expect(response).not_to have_http_status(:redirect)
    known_token = response.body

    get '/g/nope1'

    expect(response.body).to eq(known_token)
  end

  it 'answers 400 when the query string names no sensor' do
    station_stream

    get '/g/ab3k9?foo=bar'

    expect(response).to have_http_status(:bad_request)
    expect(JSON.parse(response.body)).to have_key('sensor_name')
  end
end
