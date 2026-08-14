require 'rails_helper'

RSpec.describe MobileSessions::Updater do
  subject(:updater) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:mobile_session, user: user, title: 'Old title', tag_list: 'a, b', version: 3) }

  it 'renames the title and bumps the version' do
    result = updater.call(session: session, data: { title: 'New title' })

    expect(result).to be_success
    session.reload
    expect(session.title).to eq('New title')
    expect(session.version).to eq(4)
  end

  it 'is partial — omitting a field leaves it unchanged' do
    updater.call(session: session, data: { title: 'Renamed' })
    expect(session.reload.tag_list).to match_array(%w[a b])
  end

  it 'updates tag_list' do
    updater.call(session: session, data: { tag_list: 'x, y, z' })
    expect(session.reload.tag_list).to match_array(%w[x y z])
  end

  it 'deletes a stream flagged deleted' do
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM1')
    create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

    updater.call(session: session, data: {
      streams: [{ sensor_name: 'AirBeamMini-PM1', deleted: true }],
    })

    expect(session.reload.streams.map(&:sensor_name)).to eq(['AirBeamMini-PM2.5'])
  end

  it 'reconciles notes (create, update by number, delete missing)' do
    create(:note, session: session, number: 1, text: 'keep-updated')
    create(:note, session: session, number: 2, text: 'remove-me')

    updater.call(session: session, data: {
      notes: [
        { number: 1, text: 'updated' },
        { number: 3, text: 'new', date: Time.now, latitude: 40.0, longitude: -74.0 },
      ],
    })

    notes = session.reload.notes.order(:number)
    expect(notes.map(&:number)).to eq([1, 3])
    expect(notes.find { |n| n.number == 1 }.text).to eq('updated')
  end

  describe 'airbeam (device) info' do
    it 'attaches a device when the session has none' do
      session.update!(device: nil)

      updater.call(session: session, data: {
        airbeam: { mac_address: 'AA:BB:CC:DD:EE:10', model: 'AirBeamMini' },
      })

      expect(session.reload.device.mac_address).to eq('AA:BB:CC:DD:EE:10')
    end

    it 'updates model/name on the existing device' do
      device = create(:device, mac_address: 'AA:BB:CC:DD:EE:11', model: 'AirBeamMini', name: nil)
      session.update!(device: device)

      updater.call(session: session, data: { airbeam: { name: 'Backpack' } })

      expect(device.reload.name).to eq('Backpack')
    end

    it 'swaps to another device by mac_address' do
      session.update!(device: create(:device, mac_address: 'AA:BB:CC:DD:EE:11'))

      updater.call(session: session, data: {
        airbeam: { mac_address: 'AA:BB:CC:DD:EE:22', model: 'AirBeamMini' },
      })

      expect(session.reload.device.mac_address).to eq('AA:BB:CC:DD:EE:22')
    end
  end
end
