require 'rails_helper'

RSpec.describe Api::CreateMobileSessionContract do
  subject(:contract) { described_class.new }

  let(:valid_params) do
    {
      uuid: SecureRandom.uuid,
      title: 'Bike ride',
      time_zone: 'America/New_York',
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

  it 'fails when uuid is not a UUID' do
    result = contract.call(valid_params.merge(uuid: 'test-uuid-abc'))
    expect(result).to be_failure
    expect(result.errors[:uuid].first).to match(/must be a UUID/)
  end

  it 'accepts an uppercase UUID' do
    expect(contract.call(valid_params.merge(uuid: SecureRandom.uuid.upcase))).to be_success
  end

  it 'fails when time_zone is missing (required for mobile)' do
    result = contract.call(valid_params.except(:time_zone))
    expect(result).to be_failure
    expect(result.errors[:time_zone]).to be_present
  end

  it 'fails for an invalid time_zone' do
    result = contract.call(valid_params.merge(time_zone: 'Not/AZone'))
    expect(result).to be_failure
    expect(result.errors[:time_zone]).to be_present
  end

  it 'succeeds without latitude/longitude (optional; points carry their own)' do
    expect(contract.call(valid_params.except(:latitude, :longitude))).to be_success
  end

  it 'accepts optional latitude/longitude' do
    result = contract.call(valid_params.merge(latitude: 40.7128, longitude: -74.0060))
    expect(result).to be_success
  end

  it 'fails when airbeam mac_address is missing' do
    result = contract.call(valid_params.deep_merge(airbeam: { mac_address: nil }))
    expect(result).to be_failure
    expect(result.errors[:airbeam][:mac_address]).to be_present
  end

  it 'accepts optional device name in airbeam' do
    result = contract.call(valid_params.deep_merge(airbeam: { name: 'My AirBeam' }))
    expect(result).to be_success
    expect(result.to_h[:airbeam][:name]).to eq('My AirBeam')
  end

  it 'fails when streams is empty' do
    result = contract.call(valid_params.merge(streams: []))
    expect(result).to be_failure
    expect(result.errors[:streams]).to be_present
  end

  it 'fails for unsupported sensor_name' do
    params = valid_params.merge(streams: [{ sensor_name: 'UnknownSensor-XYZ', unit_symbol: 'µg/m³' }])
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :sensor_name)).to be_present
  end

  it 'fails when unit_symbol does not match the sensor' do
    params = valid_params.merge(streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'mg/m³' }])
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :unit_symbol)).to be_present
  end

  it 'leaves the already-taken uuid check to the creator (shape only here)' do
    existing = create(:mobile_session, uuid: SecureRandom.uuid)
    expect(contract.call(valid_params.merge(uuid: existing.uuid.upcase))).to be_success
  end

  it 'fails when the same sensor is requested twice' do
    params = valid_params.merge(
      streams: [
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
      ],
    )
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 1, :sensor_name).first).to match(/duplicates the AirBeam-PM2.5 stream/)
  end

  it 'fails when two aliases of one sensor type are requested' do
    params = valid_params.merge(
      streams: [
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
        { sensor_name: 'AirBeam2-PM2.5', unit_symbol: 'µg/m³' },
      ],
    )
    result = contract.call(params)
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 1, :sensor_name)).to be_present
  end
end
