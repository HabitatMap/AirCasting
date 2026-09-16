require 'rails_helper'

RSpec.describe Api::UpdateMobileSessionContract do
  subject(:contract) { described_class.new }

  it 'rejects an empty payload — a no-op PATCH would bump the version for nothing' do
    result = contract.call({})
    expect(result).to be_failure
    expect(result.errors.to_h[nil] || result.errors.to_h[:base]).to be_present
  end

  it 'omits absent optionals from to_h (locks partial-update semantics)' do
    result = contract.call(title: 'Renamed')
    expect(result).to be_success
    expect(result.to_h).to eq(title: 'Renamed')
    expect(result.to_h).not_to have_key(:tag_list)
  end

  it 'drops unknown top-level keys (route/wrapper params)' do
    result = contract.call(title: 'x', controller: 'mobile_sessions', action: 'update', uuid: 'abc')
    expect(result.to_h.keys).to eq([:title])
  end

  it 'drops device and streams — this endpoint owns neither' do
    result = contract.call(
      title: 'x',
      device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', deleted: true }],
    )
    expect(result).to be_success
    expect(result.to_h.keys).to eq([:title])
  end

  # Notes are their own resource now — `/mobile_sessions/:uuid/notes`, keyed on
  # the note id. Sending them here is a client that has not caught up, and
  # silently ignoring them beats half-applying the update.
  it 'drops notes — they are a separate resource' do
    result = contract.call(title: 'x', notes: [{ number: 1, text: 'note' }])

    expect(result).to be_success
    expect(result.to_h.keys).to eq([:title])
  end

  it 'fails when title is blank' do
    expect(contract.call(title: '')).to be_failure
  end

  it 'accepts a null tag_list (clears every tag)' do
    expect(contract.call(tag_list: nil)).to be_success
  end
end
