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

  describe 'when a concurrent create of the same uuid won the race' do
    # Real contention is covered by spec/models/session_uuid_lock_spec.rb; the flag
    # is forced here so each branch can be asserted on its own.
    def force_contention(contended)
      allow(Session).to receive(:with_uuid_lock) { |_uuid, &block| block.call(contended) }
    end

    let!(:winner) { creator.call(data: valid_params, user: user).value }

    it "returns the winner's session, token and streams" do
      force_contention(true)

      result = creator.call(data: valid_params, user: user)

      expect(result).to be_success
      expect(result.value[:session].id).to eq(winner[:session].id)
      expect(result.value[:session_token]).to eq(winner[:session_token])
      expect(result.value[:streams]).to eq(winner[:streams])
    end

    it 'writes no second session, streams or device' do
      force_contention(true)

      counts = -> { [Session.count, Stream.count, Device.count] }
      before = counts.call()

      creator.call(data: valid_params, user: user)

      expect(counts.call()).to eq(before)
    end

    it 'keeps failing when nothing was raced' do
      force_contention(false)

      expect(creator.call(data: valid_params, user: user)).to be_failure
    end

    it 'refuses a row bound to a different AirBeam' do
      force_contention(true)
      other = Device.create!(mac_address: 'FF:EE:DD:CC:BB:AA', model: 'AirBeamMini')
      winner[:session].update_columns(device_id: other.id)

      expect(creator.call(data: valid_params, user: user)).to be_failure
    end

    it 'refuses a legacy row with no session_token, rather than answering with null' do
      force_contention(true)
      winner[:session].update_columns(session_token: nil)

      result = creator.call(data: valid_params, user: user)

      expect(result).to be_failure
    end

    it 'refuses a legacy row whose streams carry no sensor_type_id' do
      force_contention(true)
      Stream.where(session_id: winner[:session].id).update_all(sensor_type_id: nil)

      expect(creator.call(data: valid_params, user: user)).to be_failure
    end

    it 'refuses a row with no streams at all' do
      force_contention(true)
      Stream.where(session_id: winner[:session].id).delete_all

      expect(creator.call(data: valid_params, user: user)).to be_failure
    end

    it "never returns another user's session" do
      force_contention(true)
      winner[:session].update_columns(user_id: create(:user).id)

      expect(creator.call(data: valid_params, user: user)).to be_failure
    end
  end

  describe 'when the database refuses a duplicate uuid' do
    it 'fails rather than raising, once a unique index exists' do
      allow(FixedSession).to receive(:create!).and_raise(
        ActiveRecord::RecordNotUnique, 'duplicate key value violates unique constraint',
      )

      result = creator.call(data: valid_params, user: user)

      expect(result).to be_failure
      expect(result.errors[:error_code]).to eq(FixedSessions::BinaryProtocol::ErrorCodes::INTERNAL_ERROR)
    end
  end
end
