require 'rails_helper'

# The point of the lock is what happens when two requests race, which a
# transactional example cannot show — the second connection would not see the
# first one's uncommitted rows. These examples therefore manage their own data.
RSpec.describe 'Session uuid locking', type: :model do
  self.use_transactional_tests = false

  let(:uuid) { SecureRandom.uuid }
  let!(:user) { create(:user) }

  before do
    allow(TimeZoneFinderWrapper.instance).to receive(:time_zone_at).and_return('UTC')
    create(:threshold_set, :air_beam_pm2_5, :default)
  end

  after do
    # Nothing here is rolled back for us, and destroying a session writes a
    # `deleted_sessions` tombstone that other examples read — clear it too.
    Session.where(uuid: uuid).destroy_all
    DeletedSession.where(uuid: uuid).delete_all
    Device.where(mac_address: 'AA:BB:CC:DD:EE:FF').delete_all
    ThresholdSet.where(sensor_name: 'AirBeam-PM2.5').delete_all
    user.destroy
  end

  def create_params
    {
      uuid: uuid,
      title: 'Roof Session',
      latitude: 40.7128,
      longitude: -74.0060,
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
    }
  end

  it 'lets only one of two simultaneous creates through' do
    results = []
    mutex = Mutex.new
    barrier = Concurrent::CountDownLatch.new(2)

    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.count_down
          barrier.wait(5)
          result = FixedSessions::Creator.new.call(data: create_params, user: user)
          mutex.synchronize { results << result }
        end
      end
    end
    threads.each(&:join)

    expect(Session.where(uuid: uuid).count).to eq(1)
    expect(results.count(&:success?)).to eq(1)
    expect(results.count(&:failure?)).to eq(1)
  end

  it 'still creates the session when nothing competes for the lock' do
    result = FixedSessions::Creator.new.call(data: create_params, user: user)

    expect(result).to be_success
    expect(Session.where(uuid: uuid).count).to eq(1)
  end

  it 'serialises the legacy upload path too' do
    session_data = {
      uuid: uuid,
      # the legacy controller forces this before calling the builder
      type: 'MobileSession',
      contribute: true,
      title: 'Legacy upload',
      start_time: '2026-08-01T10:00:00.000Z',
      end_time: '2026-08-01T10:30:00.000Z',
      notes: [],
      streams: {},
    }

    results = []
    mutex = Mutex.new
    barrier = Concurrent::CountDownLatch.new(2)

    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.count_down
          barrier.wait(5)
          built = SessionBuilder.new(session_data.dup, [], user).build!
          mutex.synchronize { results << built }
        end
      end
    end
    threads.each(&:join)

    expect(Session.where(uuid: uuid).count).to eq(1)
    expect(results.compact.size).to eq(1)
  end
end
