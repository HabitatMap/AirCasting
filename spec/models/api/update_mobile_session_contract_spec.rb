require 'rails_helper'

RSpec.describe Api::UpdateMobileSessionContract do
  subject(:contract) { described_class.new }

  it 'succeeds with an empty payload (everything optional)' do
    expect(contract.call({})).to be_success
  end

  it 'omits absent optionals from to_h (locks partial-update semantics)' do
    result = contract.call(title: 'Renamed')
    expect(result).to be_success
    expect(result.to_h).to eq(title: 'Renamed')
    expect(result.to_h).not_to have_key(:tag_list)
    expect(result.to_h).not_to have_key(:airbeam)
  end

  it 'drops unknown top-level keys (route/wrapper params)' do
    result = contract.call(title: 'x', controller: 'mobile_sessions', action: 'update', uuid: 'abc')
    expect(result.to_h.keys).to eq([:title])
  end

  it 'fails when title is blank' do
    result = contract.call(title: '')
    expect(result).to be_failure
    expect(result.errors[:title]).to be_present
  end

  it 'requires number on each note' do
    result = contract.call(notes: [{ text: 'no number' }])
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:notes, 0, :number)).to be_present
  end

  it 'accepts full note fields' do
    result = contract.call(notes: [{ number: 1, text: 't', date: '2026-08-14T10:00:00Z', latitude: 40.0, longitude: -74.0 }])
    expect(result).to be_success
  end

  it 'requires sensor_name on each stream entry' do
    result = contract.call(streams: [{ deleted: true }])
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :sensor_name)).to be_present
  end

  it 'fails when device mac_address is blank' do
    result = contract.call(device: { mac_address: '' })
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:device, :mac_address)).to be_present
  end

  it 'accepts airbeam with only a name (partial device update)' do
    expect(contract.call(device: { name: 'Backpack' })).to be_success
  end
end
