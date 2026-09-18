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

  it 'joins tag_list with ", " — the separator the client splits on' do
    session = create(:mobile_session, user: user, tag_list: 'commute,bike')

    expect(serializer.call(session)[:tag_list]).to eq('commute, bike')
  end

  describe 'notes' do
    it 'omits notes by default — the list endpoint stays a summary' do
      session = create(:mobile_session, user: user)
      create(:note, session: session)

      expect(serializer.call(session)).not_to have_key(:notes)
    end

    it 'returns notes ordered by number when asked' do
      session = create(:mobile_session, user: user)
      create(:note, session: session, number: 2, text: 'second')
      create(:note, session: session, number: 1, text: 'first')

      notes = serializer.call(session, include_notes: true)[:notes]

      expect(notes.map { |note| note[:number] }).to eq([1, 2])
      expect(notes.first).to include(text: 'first', latitude: 10.12, longitude: 12.12)
    end

    it 'exposes photo_location so another device can download the photo' do
      session = create(:mobile_session, user: user)
      create(:note, :with_photo, session: session, number: 1)

      note = serializer.call(session, include_notes: true)[:notes].first

      expect(note[:photo_location]).to be_present
    end

    it 'returns a null photo_location for a note without one' do
      session = create(:mobile_session, user: user)
      create(:note, session: session, number: 1)

      expect(serializer.call(session, include_notes: true)[:notes].first[:photo_location]).to be_nil
    end

    it 'returns an empty array when the session has no notes' do
      session = create(:mobile_session, user: user)

      expect(serializer.call(session, include_notes: true)[:notes]).to eq([])
    end
  end
end
