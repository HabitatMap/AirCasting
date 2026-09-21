require 'rails_helper'

RSpec.describe FixedSessions::SessionSerializer do
  subject(:serializer) { described_class.new }

  let(:user) { create(:user) }

  it 'serializes metadata, deployment and per-stream identity' do
    device = create(:device, mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini')
    session = create(
      :fixed_session,
      user: user,
      device: device,
      is_indoor: true,
      latitude: 40.7128,
      longitude: -74.006,
    )
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2)

    result = serializer.call(session)

    expect(result).to include(
      uuid: session.uuid,
      title: session.title,
      type: 'FixedSession',
      contribute: true,
      is_indoor: true,
      latitude: session.latitude,
      longitude: session.longitude,
      version: session.version,
    )
    expect(result[:device]).to eq(mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini', name: nil)
    expect(result[:streams]['AirBeamMini-PM2.5']).to include(
      sensor_name: 'AirBeamMini-PM2.5',
      sensor_type_id: 2,
      measurement_type: 'hadrons',
      unit_symbol: '#',
    )
  end

  # A fixed session's streams all sit at the session's one location, and the v3
  # fixed ingest writes to `fixed_measurements`, which updates neither
  # `streams.measurements_count` nor `streams.average_value` — serializing any of
  # them would report a permanent 0 / null as data.
  it 'omits the stream fields that a fixed session never populates' do
    session = create(:fixed_session, user: user)
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    stream = serializer.call(session)[:streams]['AirBeamMini-PM2.5']

    expect(stream.keys).not_to include(
      :measurements_count, :average_value,
      :min_latitude, :max_latitude, :min_longitude, :max_longitude,
      :start_latitude, :start_longitude,
    )
  end

  it 'never carries measurements or the upload credential' do
    session = create(:fixed_session, user: user, session_token: 'abc123')
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    result = serializer.call(session)

    expect(result).not_to have_key(:session_token)
    expect(result).not_to have_key(:notes)
    expect(result[:streams]['AirBeamMini-PM2.5']).not_to have_key(:measurements)
  end

  describe 'last_measurement' do
    it "reports the stream's newest reading as a value and a real UTC epoch ms" do
      session = create(:fixed_session, user: user)
      stream = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
      newest = Time.utc(2026, 8, 14, 12, 0, 0)

      result = serializer.call(
        session,
        latest_measurements: { stream.id => { value: 12.5, time: newest } },
      )

      expect(result[:streams]['AirBeamMini-PM2.5'][:last_measurement]).to eq(
        value: 12.5,
        time: newest.to_i * 1_000,
      )
    end

    it 'is null for a stream that has never reported' do
      session = create(:fixed_session, user: user)
      create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

      result = serializer.call(session)

      expect(result[:streams]['AirBeamMini-PM2.5'][:last_measurement]).to be_nil
    end
  end

  it 'reports session bounds as real UTC epoch ms, with the zone to render them in' do
    session = create(
      :fixed_session,
      user: user,
      time_zone: 'America/New_York',
      # Stored local-as-utc: 08:00 New York wall clock, i.e. 12:00 UTC.
      start_time_local: Time.utc(2026, 8, 14, 8, 0, 0),
      end_time_local: Time.utc(2026, 8, 14, 9, 0, 0),
    )

    result = serializer.call(session)

    expect(result).to include(
      time_zone: 'America/New_York',
      start_time: Time.utc(2026, 8, 14, 12, 0, 0).to_i * 1_000,
      end_time: Time.utc(2026, 8, 14, 13, 0, 0).to_i * 1_000,
    )
  end

  # Unlike the *_local columns, this one is written from
  # `time_with_time_zone.utc` — a real instant already, whatever the session's
  # zone. It is how a client tells a live sensor from a dormant one.
  it 'reports last_measurement_at as epoch ms without a zone conversion' do
    session = create(
      :fixed_session,
      user: user,
      time_zone: 'America/New_York',
      last_measurement_at: Time.utc(2026, 8, 14, 12, 0, 0),
    )

    expect(serializer.call(session)[:last_measurement_at]).to eq(Time.utc(2026, 8, 14, 12, 0, 0).to_i * 1_000)
  end

  it 'leaves last_measurement_at null until the sensor first reports' do
    session = create(:fixed_session, user: user, last_measurement_at: nil)

    expect(serializer.call(session)[:last_measurement_at]).to be_nil
  end

  it 'exposes the shareable session link' do
    session = create(:fixed_session, user: user)

    expect(serializer.call(session)[:share_url]).to end_with("/s/#{session.url_token}")
  end

  it 'returns nil device when the session has none' do
    session = create(:fixed_session, user: user, device: nil)

    expect(serializer.call(session)[:device]).to be_nil
  end

  it 'does not leak internal database ids — clients address sessions by uuid and streams by sensor_name' do
    session = create(:fixed_session, user: user)
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    result = serializer.call(session.reload)

    expect(result).not_to have_key(:id)
    expect(result[:streams]['AirBeamMini-PM2.5']).not_to have_key(:id)
  end

  it 'carries the thresholds the client colours the stream with' do
    session = create(:fixed_session, user: user)
    threshold_set = create(
      :threshold_set,
      threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
      threshold_high: 55, threshold_very_high: 150,
    )
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5', threshold_set: threshold_set)

    expect(serializer.call(session)[:streams]['AirBeamMini-PM2.5']).to include(
      threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
      threshold_high: 55, threshold_very_high: 150,
    )
  end

  it 'joins tag_list with ", " — the separator the client splits on' do
    session = create(:fixed_session, user: user, tag_list: 'rooftop,pm')

    expect(serializer.call(session)[:tag_list]).to eq('rooftop, pm')
  end
end
