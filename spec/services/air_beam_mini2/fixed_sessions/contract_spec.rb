require 'rails_helper'

RSpec.describe AirBeamMini2::FixedSessions::Contract do
  subject(:contract) { described_class.new }

  let(:valid_params) do
    {
      uuid: 'test-uuid-123',
      title: 'My Session',
      latitude: 40.7128,
      longitude: -74.0060,
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini2' },
      streams: [{ measurement_type: 'Particulate Matter', unit: 'µg/m³', measurement_type_id: 2 }],
    }
  end

  it 'is valid with all required params' do
    expect(contract.call(valid_params)).to be_success
  end

  it 'accepts optional airbeam name' do
    params = valid_params.deep_merge(airbeam: { name: 'Bedroom sensor' })
    expect(contract.call(params)).to be_success
  end

  it 'is invalid without uuid' do
    expect(contract.call(valid_params.except(:uuid))).to be_failure
  end

  it 'is invalid without streams' do
    expect(contract.call(valid_params.except(:streams))).to be_failure
  end

  it 'is invalid with empty streams array' do
    result = contract.call(valid_params.merge(streams: []))
    expect(result).to be_failure
    expect(result.errors[:streams]).to include('must have at least one stream')
  end

  it 'is invalid without mac_address' do
    params = valid_params.deep_merge(airbeam: { mac_address: nil })
    expect(contract.call(params)).to be_failure
  end

  it 'is invalid without contribute flag' do
    expect(contract.call(valid_params.except(:contribute))).to be_failure
  end
end
