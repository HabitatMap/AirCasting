require 'rails_helper'

RSpec.describe FixedSessions::Creator do
  subject(:creator) { described_class.new }

  let(:user) { create(:user) }
  let(:valid_params) do
    {
      uuid: 'abcdef-1234',
      title: 'Test Session',
      latitude: 40.7128,
      longitude: -74.0060,
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [
        { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
      ],
    }
  end

  before do
    allow(TimeZoneFinderWrapper.instance).to receive(:time_zone_at).and_return('America/New_York')
    create(:threshold_set, :air_beam_pm1, :default)
    create(:threshold_set, :air_beam_pm2_5, :default)
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

    it 'defaults is_indoor to false when omitted' do
      creator.call(data: valid_params, user: user)
      expect(FixedSession.last.is_indoor).to be false
    end

    it 'stores is_indoor true when provided' do
      creator.call(data: valid_params.merge(is_indoor: true), user: user)
      expect(FixedSession.last.is_indoor).to be true
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
      device = Device.create!(mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini', name: 'Existing Name')
      creator.call(data: valid_params, user: user)
      expect(device.reload.name).to eq('Existing Name')
    end

    it 'creates one Stream per requested sensor' do
      expect { creator.call(data: valid_params, user: user) }.to change(Stream, :count).by(2)
    end

    it 'saves proper sensor names and sets sensor_type_id' do
      creator.call(data: valid_params, user: user)
      streams = Stream.last(2)
      expect(streams.map(&:sensor_name)).to match_array(%w[AirBeamMini-PM1 AirBeamMini-PM2.5])
      expect(streams.map(&:sensor_type_id)).to match_array([1, 2])
    end

    it 'returns a session_token in the response' do
      result = creator.call(data: valid_params, user: user)
      expect(result.value[:session_token]).to be_present
      expect(result.value[:session_token]).to eq(FixedSession.last.session_token)
    end

    it 'returns original sensor_name and sensor_type_id in response' do
      result = creator.call(data: valid_params, user: user)
      streams = result.value[:streams]
      expect(streams).to match_array([
        { sensor_name: 'AirBeamMini-PM1', sensor_type_id: 1 },
        { sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2 },
      ])
    end

    it 'returns Failure for unsupported sensor name' do
      params = valid_params.merge(streams: [{ sensor_name: 'UnknownSensor-XYZ' }])
      result = creator.call(data: params, user: user)
      expect(result).to be_failure
    end
  end
end
