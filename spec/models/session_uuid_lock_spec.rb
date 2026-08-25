require 'rails_helper'

# The point of the lock is what happens when two requests race, which a
# transactional example cannot show — the second connection would not see the
# first one's uncommitted rows. These examples therefore manage their own data.
RSpec.describe 'Session uuid locking', type: :model do
  self.use_transactional_tests = false

  let(:uuid) { SecureRandom.uuid }
  let!(:user) { create(:user) }

  before { create(:threshold_set, :air_beam_pm2_5, :default) }

  after do
    # Nothing here is rolled back for us, and destroying a session writes a
    # `deleted_sessions` tombstone that other examples read — clear it too.
    Session.where(uuid: uuid).destroy_all
    DeletedSession.where(uuid: uuid).delete_all
    Device.where(user_id: user.id).delete_all
    ThresholdSet.where(sensor_name: 'AirBeam-PM2.5').delete_all
    user.destroy
  end

  def create_params
    {
      uuid: uuid,
      title: 'Bike ride',
      time_zone: 'America/New_York',
      contribute: true,
      device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
    }
  end

  it 'lets only one of two simultaneous creates through' do
    results = []
    mutex = Mutex.new
    barrier = Concurrent::CountDownLatch.new(2) if defined?(Concurrent)

    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier&.count_down
          barrier&.wait(5)
          result = MobileSessions::Creator.new.call(data: create_params, user: user)
          mutex.synchronize { results << result }
        end
      end
    end
    threads.each(&:join)

    expect(Session.where(uuid: uuid).count).to eq(1)
    expect(results.count(&:success?)).to eq(1)

    failure = results.find(&:failure?)
    expect(failure.errors[:error_code]).to eq('session_uuid_taken')
  end

  it 'still creates the session when nothing competes for the lock' do
    result = MobileSessions::Creator.new.call(data: create_params, user: user)

    expect(result).to be_success
    expect(Session.where(uuid: uuid).count).to eq(1)
  end
end
