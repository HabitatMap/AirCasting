require 'rails_helper'

RSpec.describe AirBeamMini2::FixedSessions::Creator do
  subject(:creator) { described_class.new }

  let(:user) { create(:user) }
  let(:valid_params) do
    {
      uuid: 'abcdef-1234',
      title: 'Test Session',
      latitude: 40.7128,
      longitude: -74.0060,
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini2' },
      streams: [
        { measurement_type: 'Particulate Matter', unit: 'µg/m³', measurement_type_id: 2 },
      ],
    }
  end

  before do
    allow(TimeZoneFinderWrapper.instance).to receive(:time_zone_at).and_return('America/New_York')
    ThresholdSet.find_or_create_by!(
      sensor_name: 'AirBeam-PM2.5',
      unit_symbol: 'µg/m³',
      is_default: true,
      threshold_very_low: 0, threshold_low: 12, threshold_medium: 35,
      threshold_high: 55, threshold_very_high: 150,
    )
  end

  describe '#call' do
    it 'returns Success' do
      result = creator.call(data: valid_params, user: user)
      expect(result).to be_success
    end

    it 'creates a FixedSession' do
      expect { creator.call(data: valid_params, user: user) }.to change(FixedSession, :count).by(1)
    end

    it 'stores contribute flag from request' do
      creator.call(data: valid_params.merge(contribute: false), user: user)
      expect(FixedSession.last.contribute).to be false
    end

    it 'creates a Device and links it to the session' do
      expect { creator.call(data: valid_params, user: user) }
        .to change(Device, :count).by(1)
      session = FixedSession.last
      expect(session.device.mac_address).to eq('AA:BB:CC:DD:EE:FF')
    end

    it 'reuses existing Device for same mac_address' do
      creator.call(data: valid_params, user: user)
      expect { creator.call(data: valid_params.merge(uuid: 'other-uuid'), user: user) }
        .not_to change(Device, :count)
    end

    it 'updates device name when provided' do
      params = valid_params.deep_merge(airbeam: { name: 'Bedroom' })
      creator.call(data: params, user: user)
      expect(Device.last.name).to eq('Bedroom')
    end

    it 'does not overwrite device name when name is absent from request' do
      device = Device.create!(mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini2', name: 'Existing Name')
      creator.call(data: valid_params, user: user)
      expect(device.reload.name).to eq('Existing Name')
    end

    it 'creates Streams with measurement_type_id' do
      creator.call(data: valid_params, user: user)
      stream = Stream.last
      expect(stream.measurement_type_id).to eq(2)  # PM2.5 = 2
      expect(stream.sensor_name).to eq('AirBeam-PM2.5')
    end

    it 'returns streams with measurement_type_id in response' do
      result = creator.call(data: valid_params, user: user)
      streams = result.value[:streams]
      expect(streams.first[:measurement_type_id]).to eq(2)
      expect(streams.first[:measurement_type]).to eq('Particulate Matter')
      expect(streams.first[:unit]).to eq('µg/m³')
    end

    it 'returns Failure for unknown stream type' do
      params = valid_params.merge(streams: [{ measurement_type: 'Unknown', unit: 'xyz' }])
      result = creator.call(data: params, user: user)
      expect(result).to be_failure
    end

  end
end
