require 'rails_helper'

RSpec.describe Api::CreateMobileSessionContract do
  subject(:contract) { described_class.new }

  let(:valid_params) do
    {
      uuid: SecureRandom.uuid,
      title: 'Bike ride',
      time_zone: 'America/New_York',
      contribute: true,
      device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
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

  it 'fails when device mac_address is missing' do
    result = contract.call(valid_params.deep_merge(device: { mac_address: nil }))
    expect(result).to be_failure
    expect(result.errors[:device][:mac_address]).to be_present
  end

  it 'accepts an optional device name' do
    result = contract.call(valid_params.deep_merge(device: { name: 'My AirBeam' }))
    expect(result).to be_success
    expect(result.to_h[:device][:name]).to eq('My AirBeam')
  end

  it 'fails when streams is empty' do
    result = contract.call(valid_params.merge(streams: []))
    expect(result).to be_failure
    expect(result.errors[:streams]).to be_present
  end

  context 'custom sensors' do
    let(:custom_stream) do
      { sensor_name: 'Bosch-BMP180', unit_symbol: 'hPa', measurement_type: 'Barometric pressure',
        measurement_short_type: 'hPa', unit_name: 'hectopascals',
        thresholds: { very_low: 950.0, low: 980.0, medium: 1000.0, high: 1020.0, very_high: 1050.0 } }
    end

    it 'accepts an unknown sensor when the client describes it' do
      expect(contract.call(valid_params.merge(streams: [custom_stream]))).to be_success
    end

    it 'requires the metadata the server cannot infer' do
      result = contract.call(valid_params.merge(
        streams: [{ sensor_name: 'Bosch-BMP180', unit_symbol: 'hPa' }],
      ))
      expect(result).to be_failure
      errors = result.errors.to_h.dig(:streams, 0)
      expect(errors.keys).to match_array(%i[measurement_type measurement_short_type unit_name])
    end

    it 'caps the length of client-described fields' do
      result = contract.call(valid_params.merge(
        streams: [custom_stream.merge(measurement_type: 'x' * 65)],
      ))
      expect(result).to be_failure
      expect(result.errors.to_h.dig(:streams, 0, :measurement_type).first).to match(/at most 64/)
    end

    it 'rejects a custom sensor that reuses a built-in name' do
      result = contract.call(valid_params.merge(
        streams: [custom_stream.merge(sensor_name: 'airbeam2-pm2.5')],
      ))
      expect(result).to be_failure
      expect(result.errors.to_h.dig(:streams, 0, :sensor_name).first).to match(/built-in sensor name/)
    end

    it 'does not ask a known sensor for metadata' do
      expect(contract.call(valid_params)).to be_success
    end
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
  it 'accepts optional thresholds on a stream' do
    result = contract.call(valid_params.merge(
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³',
                  thresholds: { very_low: 0.0, low: 9.0, medium: 35.0, high: 55.0, very_high: 150.0 } }],
    ))
    expect(result).to be_success
  end

  it 'fails when thresholds are given but incomplete' do
    result = contract.call(valid_params.merge(
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³',
                  thresholds: { very_low: 0.0, low: 9.0 } }],
    ))
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :thresholds)).to be_present
  end

  it 'fails when thresholds are not in ascending order' do
    result = contract.call(valid_params.merge(
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³',
                  thresholds: { very_low: 50.0, low: 20.0, medium: 70.0, high: 80.0, very_high: 100.0 } }],
    ))
    expect(result).to be_failure
    expect(result.errors.to_h.dig(:streams, 0, :thresholds).first).to match(/ascending order/)
  end

  it 'accepts a calibrated mic scale with a negative floor' do
    result = contract.call(valid_params.merge(
      streams: [{ sensor_name: 'Phone Microphone', unit_symbol: 'dB',
                  thresholds: { very_low: -100.0, low: 60.0, medium: 70.0, high: 80.0, very_high: 100.0 } }],
    ))
    expect(result).to be_success
  end
end
