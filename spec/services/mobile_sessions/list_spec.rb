require 'rails_helper'

RSpec.describe MobileSessions::List do
  let(:user) { create(:user) }

  it "returns only the given user's mobile sessions" do
    mine = create(:mobile_session, user: user)
    create(:mobile_session)                       # another user
    create(:fixed_session, user: user)            # not a mobile session

    result = described_class.new(user: user).call

    expect(result.map { |s| s[:uuid] }).to eq([mine.uuid])
  end

  it 'includes metadata, version, airbeam and per-stream aggregates (no measurements)' do
    device = create(:device, mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini')
    session = create(:mobile_session, user: user, device: device)
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    row = described_class.new(user: user).call.first

    expect(row).to include(:uuid, :title, :version, :start_time_local, :end_time_local, :tag_list, :share_url)
    expect(row[:airbeam]).to eq(mac_address: 'AA:BB:CC:DD:EE:01', model: 'AirBeamMini', name: nil)
    expect(row[:streams]).to have_key('AirBeamMini-PM2.5')
    expect(row[:streams]['AirBeamMini-PM2.5']).to include(:measurements_count, :average_value, :min_latitude)
    expect(row[:streams]['AirBeamMini-PM2.5']).not_to have_key(:measurements)
  end

  it 'is null-safe for a stream without measurements yet' do
    session = create(:mobile_session, user: user)
    create(:stream, session: session, average_value: nil)

    expect { described_class.new(user: user).call }.not_to raise_error
  end

  it 'paginates when per_page is given' do
    create_list(:mobile_session, 3, user: user)

    expect(described_class.new(user: user, page: 1, per_page: 2).call.size).to eq(2)
    expect(described_class.new(user: user, page: 2, per_page: 2).call.size).to eq(1)
  end

  it 'returns the full set when no pagination is given' do
    create_list(:mobile_session, 3, user: user)
    expect(described_class.new(user: user).call.size).to eq(3)
  end
end
