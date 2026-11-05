require 'rails_helper'

describe Explore::StationStreamsQuery do
  subject(:query) { described_class.new }

  let(:anchor) { Time.utc(2026, 8, 14, 12, 0, 0) }

  def government_station(**attributes)
    source = create(:source, name: 'EPA')
    station = create(:station, source: source, **attributes)
    create(
      :station_stream,
      source: source, station: station, last_measured_at: anchor,
      stream_configuration: create(:stream_configuration, measurement_type: 'PM2.5'),
    )
    station.reload
  end

  it 'names a government stream the way the station detail does' do
    station = government_station

    streams = query.call(uuid: station.uuid)

    expect(streams.map(&:sensor_name)).to eq(['Government-PM2.5'])
    expect(streams.first).to have_attributes(source: 'government', last_measured_at: anchor)
  end

  it 'returns every stream of a public AirBeam session, anchored on the session' do
    session =
      create(:fixed_session, contribute: true, is_indoor: false, last_measurement_at: anchor)
    create(:stream, :fixed, session: session, sensor_name: 'AirBeam3-PM2.5')
    create(:stream, :fixed, session: session, sensor_name: 'AirBeam3-RH')

    streams = query.call(uuid: session.uuid)

    expect(streams.map(&:sensor_name)).to match_array(%w[AirBeam3-PM2.5 AirBeam3-RH])
    expect(streams).to all(have_attributes(source: 'airbeam', last_measured_at: anchor))
    expect(streams).to all(be_airbeam)
  end

  # A non-canonical configuration is a duplicate feed of the same pollutant;
  # the detail endpoint lists only the canonical one, so this must agree.
  it 'skips a non-canonical government stream' do
    source = create(:source, name: 'EPA')
    station = create(:station, source: source)
    create(
      :station_stream,
      source: source, station: station,
      stream_configuration: create(:stream_configuration, measurement_type: 'O3', canonical: false),
    )

    expect(query.call(uuid: station.reload.uuid)).to be_nil
  end

  # nil, not [] — "not public" and "no streams" must not read the same.
  it 'is nil for a private, indoor, excluded or unknown uuid' do
    private_session = create(:fixed_session, contribute: false, is_indoor: false)
    create(:stream, :fixed, session: private_session)
    indoor_session = create(:fixed_session, contribute: true, is_indoor: true)
    create(:stream, :fixed, session: indoor_session)
    excluded = government_station(excluded_reason: Station::EXCLUDED_REASONS[:temporary])

    expect(query.call(uuid: private_session.uuid)).to be_nil
    expect(query.call(uuid: indoor_session.uuid)).to be_nil
    expect(query.call(uuid: excluded.uuid)).to be_nil
    expect(query.call(uuid: SecureRandom.uuid)).to be_nil
  end

  # `stations.uuid` is a typed column; a malformed literal would raise rather
  # than answer no rows, so the government probe is skipped entirely.
  it 'does not raise on a uuid that is not in uuid format' do
    expect { query.call(uuid: 'not-a-uuid') }.not_to raise_error
  end
end
