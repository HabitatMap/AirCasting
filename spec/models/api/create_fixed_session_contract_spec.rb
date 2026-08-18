require 'rails_helper'

RSpec.describe Api::CreateFixedSessionContract do
  subject(:contract) { described_class.new }

  let(:valid_params) do
    {
      uuid: SecureRandom.uuid,
      title: 'Roof Session',
      latitude: 40.7128,
      longitude: -74.0060,
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
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

  it 'accepts multiple valid streams' do
    params = valid_params.merge(
      streams: [
        { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
      ],
    )
    expect(contract.call(params)).to be_success
  end

  it 'fails for unsupported sensor_name' do
    params = valid_params.merge(streams: [{ sensor_name: 'UnknownSensor-XYZ', unit_symbol: 'µg/m³' }])
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :sensor_name)).to be_present
  end

  it 'fails when unit_symbol does not match the sensor' do
    params = valid_params.merge(
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'mg/m³' }],
    )
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :unit_symbol)).to be_present
  end

  it 'leaves the already-taken uuid check to the creator (shape only here)' do
    existing = create(:fixed_session, uuid: SecureRandom.uuid)
    expect(contract.call(valid_params.merge(uuid: existing.uuid.upcase))).to be_success
  end

  it 'fails when uuid is not a UUID' do
    result = contract.call(valid_params.merge(uuid: 'test-uuid-abc'))
    expect(result).to be_failure
    expect(result.errors[:uuid].first).to match(/must be a UUID/)
  end

  it 'accepts an uppercase UUID' do
    expect(contract.call(valid_params.merge(uuid: SecureRandom.uuid.upcase))).to be_success
  end

  it 'fails when the same sensor type is requested twice' do
    params = valid_params.merge(
      streams: [
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
        { sensor_name: 'AirBeam2-PM2.5', unit_symbol: 'µg/m³' },
      ],
    )
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 1, :sensor_name).first).to match(/duplicates the AirBeam-PM2.5 stream/)
  end

  it 'succeeds without a time_zone (optional)' do
    expect(contract.call(valid_params.except(:time_zone))).to be_success
  end

  it 'accepts a valid IANA time_zone' do
    result = contract.call(valid_params.merge(time_zone: 'Europe/Warsaw'))
    expect(result).to be_success
    expect(result.to_h[:time_zone]).to eq('Europe/Warsaw')
  end

  it 'fails for an invalid time_zone' do
    result = contract.call(valid_params.merge(time_zone: 'Not/AZone'))
    expect(result).to be_failure
    expect(result.errors[:time_zone]).to be_present
  end
end
