require 'rails_helper'

describe Api::ToStationLink do
  let(:source) { create(:source, name: 'EPA', full_name: 'US EPA AirNow') }
  let(:pm) { create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³') }

  def site(**attributes)
    create(
      :station,
      source: source,
      title: 'Queens College',
      url_token: 'ab3k9',
      **attributes,
    )
  end

  def stream(station, configuration)
    create(
      :station_stream,
      source: source,
      station: station,
      stream_configuration: configuration,
      location: station.location,
    )
  end

  def call(params)
    described_class.new(contract: Api::LinksContract.new.call(params)).call
  end

  it 'points the map at the named stream of the station behind the token' do
    pm_stream = stream(site, pm)

    result = call(url_token: 'ab3k9', sensor_name: 'Government-PM2.5')

    expect(result).to be_success
    params = CGI.parse(URI.parse(result.value).query)
    # Both ids are the station stream's: the web map selects a station stream,
    # not a station, for government data.
    expect(params).to include(
      'sessionId' => [pm_stream.id.to_s],
      'streamId' => [pm_stream.id.to_s],
      'sensorName' => ['Government-PM2.5'],
      'sessionType' => ['fixed'],
      'thresholdMin' => ['0'],
      'thresholdMax' => ['150'],
    )
    # The catalogue name the map filters on, not the source's own spelling.
    expect(params['measurementType']).to eq(['Particulate Matter'])
  end

  it 'matches the sensor name regardless of case' do
    stream(site, pm)

    expect(call(url_token: 'ab3k9', sensor_name: 'government-pm2.5')).to be_success
  end

  it 'picks the stream the map draws, not a duplicate in another unit' do
    station = site
    legacy =
      create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'ppb', canonical: false)
    stream(station, legacy)
    canonical = stream(station, pm)

    result = call(url_token: 'ab3k9', sensor_name: 'Government-PM2.5')

    expect(CGI.parse(URI.parse(result.value).query)['streamId']).to eq([canonical.id.to_s])
  end

  it 'raises NotFound for an unknown token' do
    stream(site, pm)

    expect { call(url_token: 'nope1', sensor_name: 'Government-PM2.5') }
      .to raise_error(NotFound)
  end

  it 'raises NotFound for an excluded station' do
    stream(site(excluded_reason: Station::EXCLUDED_REASONS[:temporary]), pm)

    expect { call(url_token: 'ab3k9', sensor_name: 'Government-PM2.5') }
      .to raise_error(NotFound)
  end

  it 'raises NotFound when the station has no such stream' do
    stream(site, pm)

    expect { call(url_token: 'ab3k9', sensor_name: 'Government-Ozone') }
      .to raise_error(NotFound)
  end

  it 'fails the contract when sensor_name is missing' do
    stream(site, pm)

    result = call(url_token: 'ab3k9')

    expect(result).to be_failure
    expect(result.errors).to have_key(:sensor_name)
  end
end
