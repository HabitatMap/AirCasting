require 'rails_helper'

RSpec.describe MobileSessions::Creator do
  subject(:creator) { described_class.new }

  let(:user) { create(:user) }
  let(:valid_params) do
    {
      uuid: 'abcdef-1234',
      title: 'Bike ride',
      time_zone: 'America/New_York',
      contribute: true,
      tag_list: 'commute, bike',
      latitude: 40.7128,
      longitude: -74.0060,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [
        { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
        { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
      ],
    }
  end

  before do
    create(:threshold_set, :air_beam_pm1, :default)
    create(:threshold_set, :air_beam_pm2_5, :default)
  end

  describe '#call' do
    it 'returns Success' do
      expect(creator.call(data: valid_params, user: user)).to be_success
    end

    it 'creates a MobileSession' do
      expect { creator.call(data: valid_params, user: user) }.to change(MobileSession, :count).by(1)
    end

    it 'uses the provided time_zone (no coordinate lookup)' do
      creator.call(data: valid_params, user: user)
      expect(MobileSession.last.time_zone).to eq('America/New_York')
    end

    it 'stores contribute flag and tag_list' do
      creator.call(data: valid_params.merge(contribute: false), user: user)
      session = MobileSession.last
      expect(session.contribute).to be false
      expect(session.tag_list).to match_array(%w[commute bike])
    end

    it 'stores session latitude/longitude when provided' do
      creator.call(data: valid_params, user: user)
      session = MobileSession.last
      expect(session.latitude).to eq(40.7128)
      expect(session.longitude).to eq(-74.0060)
    end

    it 'leaves start/end times NULL until the first measurements arrive' do
      creator.call(data: valid_params, user: user)
      session = MobileSession.last
      expect(session.start_time_local).to be_nil
      expect(session.end_time_local).to be_nil
    end

    it 'marks the session as outdoor' do
      creator.call(data: valid_params, user: user)
      expect(MobileSession.last.is_indoor).to be false
    end

    it 'ignores params outside the schema (contract strips them)' do
      contract = Api::CreateMobileSessionContract.new.call(
        valid_params.merge(uuid: SecureRandom.uuid, is_indoor: true, version: 7, start_time: '2026-08-01T10:00:00Z'),
      )
      expect(contract).to be_success
      expect(contract.to_h.keys).not_to include(:is_indoor, :version, :start_time)
    end

    it 'is excluded from map search until it has measurements' do
      creator.call(data: valid_params, user: user)
      expect(MobileSession.filter_({})).to be_empty
    end

    it 'creates a Device and links it to the session' do
      expect { creator.call(data: valid_params, user: user) }.to change(Device, :count).by(1)
      expect(MobileSession.last.device.mac_address).to eq('AA:BB:CC:DD:EE:FF')
    end

    it 'reuses existing Device for same mac_address' do
      creator.call(data: valid_params, user: user)
      expect { creator.call(data: valid_params.merge(uuid: 'other-uuid'), user: user) }
        .not_to change(Device, :count)
    end

    it 'gives each user their own device row for one mac_address' do
      other_user = create(:user)

      creator.call(data: valid_params, user: user)
      creator.call(data: valid_params.merge(uuid: SecureRandom.uuid), user: other_user)

      devices = Device.where(mac_address: 'AA:BB:CC:DD:EE:FF')
      expect(devices.count).to eq(2)
      expect(devices.map(&:user_id)).to match_array([user.id, other_user.id])
    end

    it 'never reuses another user\'s device row' do
      other_user = create(:user)
      foreign = create(:device, user: other_user, mac_address: 'AA:BB:CC:DD:EE:FF', name: 'Their AirBeam')

      creator.call(data: valid_params.deep_merge(airbeam: { name: 'My AirBeam' }), user: user)

      expect(foreign.reload.name).to eq('Their AirBeam')
      expect(MobileSession.last.device.user_id).to eq(user.id)
    end

    it 'updates device name when provided' do
      params = valid_params.deep_merge(airbeam: { name: 'My AirBeam' })
      creator.call(data: params, user: user)
      expect(Device.last.name).to eq('My AirBeam')
    end

    it 'creates one Stream per requested sensor with sensor_type_id' do
      expect { creator.call(data: valid_params, user: user) }.to change(Stream, :count).by(2)
      streams = Stream.last(2)
      expect(streams.map(&:sensor_name)).to match_array(%w[AirBeamMini-PM1 AirBeamMini-PM2.5])
      expect(streams.map(&:sensor_type_id)).to match_array([1, 2])
    end

    it 'returns original sensor_name and sensor_type_id in response (no session_token)' do
      result = creator.call(data: valid_params, user: user)
      expect(result.value).not_to have_key(:session_token)
      expect(result.value[:streams]).to match_array([
        { sensor_name: 'AirBeamMini-PM1', sensor_type_id: 1 },
        { sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2 },
      ])
    end

    it 'returns session_uuid_taken when the uuid is already used (case-insensitive)' do
      existing = create(:mobile_session)
      result = creator.call(data: valid_params.merge(uuid: existing.uuid.upcase), user: user)

      expect(result).to be_failure
      expect(result.errors[:error_code]).to eq('session_uuid_taken')
      expect(result.errors[:message]).to eq(described_class::UUID_TAKEN_MESSAGE)
    end

    it 'creates nothing when the uuid is taken' do
      existing = create(:mobile_session)

      expect { creator.call(data: valid_params.merge(uuid: existing.uuid), user: user) }
        .not_to change(MobileSession, :count)
    end

    it 'maps a raced uuid (model validation) to session_uuid_taken too' do
      allow(MobileSession).to receive(:create!) do
        session = MobileSession.new
        session.errors.add(:uuid, :taken)
        raise ActiveRecord::RecordInvalid, session
      end

      result = creator.call(data: valid_params, user: user)
      expect(result.errors[:error_code]).to eq('session_uuid_taken')
    end

    it 'maps a unique-constraint violation to validation_error without leaking database text' do
      allow_any_instance_of(StreamsRepository).to receive(:create!)
        .and_raise(ActiveRecord::RecordNotUnique, 'PG::UniqueViolation: duplicate key ... idx_streams_session_sensor_type_id')

      result = creator.call(data: valid_params, user: user)
      expect(result.errors[:error_code]).to eq('validation_error')
      expect(result.errors[:message]).to eq('Request conflicts with an existing record')
    end

    it 'returns Failure for unsupported sensor name' do
      params = valid_params.merge(streams: [{ sensor_name: 'UnknownSensor-XYZ', unit_symbol: 'µg/m³' }])
      expect(creator.call(data: params, user: user)).to be_failure
    end
  end
end
