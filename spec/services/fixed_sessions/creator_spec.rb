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

    it 'derives time_zone from coordinates when not provided' do
      creator.call(data: valid_params, user: user)
      expect(TimeZoneFinderWrapper.instance)
        .to have_received(:time_zone_at).with(lat: 40.7128, lng: -74.0060)
      expect(FixedSession.last.time_zone).to eq('America/New_York')
    end

    it 'uses the provided time_zone and skips coordinate lookup' do
      creator.call(data: valid_params.merge(time_zone: 'Europe/Warsaw'), user: user)
      expect(FixedSession.last.time_zone).to eq('Europe/Warsaw')
      expect(TimeZoneFinderWrapper.instance).not_to have_received(:time_zone_at)
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
      device = Device.create!(user: user, mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini', name: 'Existing Name')
      creator.call(data: valid_params, user: user)
      expect(device.reload.name).to eq('Existing Name')
    end

    it 'gives each user their own device row for one mac_address' do
      other_user = create(:user)

      creator.call(data: valid_params, user: user)
      creator.call(data: valid_params.merge(uuid: SecureRandom.uuid), user: other_user)

      devices = Device.where(mac_address: 'AA:BB:CC:DD:EE:FF')
      expect(devices.count).to eq(2)
      expect(devices.map(&:user_id)).to match_array([user.id, other_user.id])
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

    it 'returns session_uuid_taken when the uuid is already used (case-insensitive)' do
      existing = create(:fixed_session)
      result = creator.call(data: valid_params.merge(uuid: existing.uuid.upcase), user: user)

      expect(result).to be_failure
      expect(result.errors[:error_code]).to eq('session_uuid_taken')
      expect(result.errors[:message]).to eq(described_class::UUID_TAKEN_MESSAGE)
    end

    it 'creates nothing when the uuid is taken' do
      existing = create(:fixed_session)

      expect { creator.call(data: valid_params.merge(uuid: existing.uuid), user: user) }
        .not_to change(FixedSession, :count)
    end

    it 'maps a raced uuid (model validation) to session_uuid_taken too' do
      allow(FixedSession).to receive(:create!) do
        session = FixedSession.new
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

      expect(result).to be_failure
      expect(result.errors[:error_code]).to eq('validation_error')
      expect(result.errors[:message]).to eq('Request conflicts with an existing record')
    end
  end
end
