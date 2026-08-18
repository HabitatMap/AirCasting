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
    expect(result[:airbeam]).to eq(mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini', name: nil)
    expect(result[:streams]).to have_key('AirBeamMini-PM2.5')
    expect(result[:streams]['AirBeamMini-PM2.5']).to include(:measurements_count, :average_value, :min_latitude)
    expect(result[:streams]['AirBeamMini-PM2.5']).not_to have_key(:measurements)
  end

  it 'exposes the shareable session link so a synced session stays shareable' do
    session = create(:mobile_session, user: user)

    expect(serializer.call(session)[:share_url]).to end_with("/s/#{session.url_token}")
  end

  it 'returns nil airbeam when the session has no device' do
    session = create(:mobile_session, user: user, device: nil)
    expect(serializer.call(session)[:airbeam]).to be_nil
  end

  it 'is null-safe for a stream without measurements yet' do
    session = create(:mobile_session, user: user)
    create(:stream, session: session, average_value: nil)
    expect { serializer.call(session) }.not_to raise_error
  end
end
