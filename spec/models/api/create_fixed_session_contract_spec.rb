require 'rails_helper'

RSpec.describe Api::CreateFixedSessionContract do
  subject(:contract) { described_class.new }

  let(:valid_params) do
    {
      uuid: 'test-uuid-abc',
      title: 'Roof Session',
      latitude: 40.7128,
      longitude: -74.0060,
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini2' },
      streams: [{ measurement_type: 'Particulate Matter', unit: 'µg/m³' }],
    }
  end

  it 'succeeds with valid params' do
    expect(contract.call(valid_params)).to be_success
  end

  it 'fails when uuid is missing' do
    result = contract.call(valid_params.except(:uuid))
    expect(result).to be_failure
    expect(result.errors[:uuid]).to be_present
  end

  it 'fails when latitude is missing' do
    result = contract.call(valid_params.except(:latitude))
    expect(result).to be_failure
    expect(result.errors[:latitude]).to be_present
  end

  it 'fails when airbeam mac_address is missing' do
    result = contract.call(valid_params.deep_merge(airbeam: { mac_address: nil }))
    expect(result).to be_failure
    expect(result.errors[:airbeam][:mac_address]).to be_present
  end

  it 'fails when streams is empty' do
    result = contract.call(valid_params.merge(streams: []))
    expect(result).to be_failure
    expect(result.errors[:streams]).to be_present
  end

  it 'accepts optional device name in airbeam' do
    result = contract.call(valid_params.deep_merge(airbeam: { name: 'Bedroom sensor' }))
    expect(result).to be_success
    expect(result.to_h[:airbeam][:name]).to eq('Bedroom sensor')
  end

  it 'accepts optional measurement_type_id in streams' do
    params = valid_params.merge(
      streams: [{ measurement_type: 'Particulate Matter', unit: 'µg/m³', measurement_type_id: 2 }],
    )
    result = contract.call(params)
    expect(result).to be_success
    expect(result.to_h[:streams].first[:measurement_type_id]).to eq(2)
  end
end
