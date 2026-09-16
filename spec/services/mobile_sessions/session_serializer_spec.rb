require 'rails_helper'

RSpec.describe MobileSessions::SessionSerializer do
  subject(:serializer) { described_class.new }

  let(:user) { create(:user) }

  it 'serializes metadata, version, airbeam and per-stream aggregates (no measurements)' do
    device = create(:device, mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini')
    session = create(:mobile_session, user: user, device: device)
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    result = serializer.call(session)

    expect(result).to include(
      uuid: session.uuid,
      title: session.title,
      type: 'MobileSession',
      version: session.version,
    )
    expect(result[:device]).to eq(mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini', name: nil)
    expect(result[:streams]).to have_key('AirBeamMini-PM2.5')
    expect(result[:streams]['AirBeamMini-PM2.5']).to include(:measurements_count, :average_value, :min_latitude)
    expect(result[:streams]['AirBeamMini-PM2.5']).not_to have_key(:measurements)
  end

  it 'reports session bounds as real UTC epoch ms, with the zone to render them in' do
    session = create(
      :mobile_session,
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

  it 'leaves the bounds null until the first measurements land' do
    session = create(:mobile_session, user: user, start_time_local: nil, end_time_local: nil)

    expect(serializer.call(session)).to include(start_time: nil, end_time: nil)
  end

  it 'exposes the shareable session link so a synced session stays shareable' do
    session = create(:mobile_session, user: user)

    expect(serializer.call(session)[:share_url]).to end_with("/s/#{session.url_token}")
  end

  it 'returns nil device when the session has none' do
    session = create(:mobile_session, user: user, device: nil)
    expect(serializer.call(session)[:device]).to be_nil
  end

  it 'is null-safe for a stream without measurements yet' do
    session = create(:mobile_session, user: user)
    create(:stream, session: session, average_value: nil)
    expect { serializer.call(session) }.not_to raise_error
  end

  it 'does not leak internal database ids — clients address sessions by uuid and streams by sensor_name' do
    session = create(:mobile_session, user: create(:user))
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    row = described_class.new.call(session.reload)

    expect(row).not_to have_key(:id)
    expect(row[:streams]['AirBeamMini-PM2.5']).not_to have_key(:id)
  end
end
