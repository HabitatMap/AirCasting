require 'rails_helper'

# What happens when two requests race — the only place the recovery path runs for
# real rather than from a stubbed constraint violation.
#
# use_transactional_tests must stay false, for both styles here. It sets
# lock_thread on the pool, which hands every thread the *same* connection: the
# threaded examples would then have no second session to race against, and the
# before_create harness deadlocks outright — the rival waits for a connection the
# main thread is holding mid-INSERT, while the main thread waits to join the rival.
# Measured at six and a half minutes before something gave way, so this fails as a
# hang rather than as a red example.
#
# The cost is manual teardown, which is why the `after` block ensures the user is
# destroyed and why the factories generate collision-proof emails and usernames: a
# row left behind here used to take the next run down with it.
RSpec.describe 'Concurrent session creation', type: :model do
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
    # LOWER(): one example creates case variants of this uuid.
    Session.where('LOWER(uuid) = ?', uuid.downcase).each do |session|
      session.streams.each { |stream| stream.measurements.delete_all }
      session.streams.delete_all
      session.destroy
    end
    DeletedSession.where('LOWER(uuid) = ?', uuid.downcase).delete_all
    Device.where(mac_address: 'AA:BB:CC:DD:EE:FF').delete_all
    ThresholdSet.where(sensor_name: 'AirBeam-PM2.5').delete_all
  ensure
    # Last, and in an ensure: a raise in any cleanup above would otherwise leave the
    # user behind, and nothing rolls it back for us.
    user.destroy if user&.persisted?
  end

  # A rival that commits in the one window the recovery path needs: after this
  # request's uniqueness validation has passed, before its INSERT. before_create
  # fires exactly there, so the race is deterministic — no thread timing, no flake.
  # Fires once; the rival's own create must not re-enter it.
  def rival_commits_during_insert(model, rival)
    fired = false
    hook =
      lambda do |_record|
        next if fired

        fired = true
        Thread.new { ActiveRecord::Base.connection_pool.with_connection { rival.call } }.join
      end

    model.set_callback(:create, :before, hook)
    yield
  ensure
    model.skip_callback(:create, :before, hook, raise: false)
  end

  def legacy_session_data
    {
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

  it 'answers both simultaneous creates with the same session, creating one row' do
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
    expect(results.count(&:success?)).to eq(2)

    sessions = results.map { |r| r.value[:session] }
    expect(sessions.map(&:id).uniq.size).to eq(1)

    # The AirBeam is flashed with whichever token it receives, so the loser must
    # not be handed a second one for the same session.
    tokens = results.map { |r| r.value[:session_token] }
    expect(tokens.uniq.size).to eq(1)
    expect(tokens.first).to eq(Session.find_by(uuid: uuid).session_token)

    streams = results.map { |r| r.value[:streams] }
    expect(streams.first).to eq(streams.last)
    expect(Stream.where(session_id: sessions.first.id).count).to eq(1)
  end

  it 'answers two creates whose uuids differ only in case with one session' do
    # The uniqueness validation, the contract's uuid rule and the unique index are
    # all case-insensitive, so these two are the same session.
    results = []
    mutex = Mutex.new
    barrier = Concurrent::CountDownLatch.new(2)

    [uuid.upcase, uuid.downcase].map do |variant|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.count_down
          barrier.wait(5)
          result = FixedSessions::Creator.new.call(data: create_params.merge(uuid: variant), user: user)
          mutex.synchronize { results << result }
        end
      end
    end.each(&:join)

    # Whether the loser recovers or is caught by the validation depends on which
    # side of the winner's COMMIT it lands, which no barrier can pin down. What must
    # hold either way: one row, and nobody handed a session that is not this one.
    expect(Session.where('LOWER(uuid) = ?', uuid.downcase).count).to eq(1)
    expect(results.count(&:success?)).to be >= 1
    expect(results.select(&:success?).map { |r| r.value[:session].id }.uniq.size).to eq(1)
  end

  it 'still creates the session when nothing competes' do
    result = FixedSessions::Creator.new.call(data: create_params, user: user)

    expect(result).to be_success
    expect(Session.where(uuid: uuid).count).to eq(1)
  end

  it 'answers both racing legacy uploads with the same session' do
    session_data = legacy_session_data

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
    expect(results.compact).not_to be_empty
    expect(results.compact.map(&:id).uniq.size).to eq(1)
  end

  it 'bounds the wait on a rival\'s in-flight insert instead of parking forever' do
    # Nothing in the server config or database.yml sets lock_timeout, so without
    # SET LOCAL an insert meeting an uncommitted index entry waits for that
    # transaction with no bound, holding a puma thread.
    winner_started = Concurrent::CountDownLatch.new(1)
    loser_done = Concurrent::CountDownLatch.new(1)
    outcome = nil

    winner = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        ActiveRecord::Base.transaction do
          FixedSessions::Creator.new.call(data: create_params, user: user)
          winner_started.count_down
          loser_done.wait(15) # hold the uncommitted row
        end
      end
    end

    loser = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        winner_started.wait(5)
        started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        outcome = FixedSessions::Creator.new.call(data: create_params, user: user)
        @waited = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
        loser_done.count_down
      end
    end

    [winner, loser].each(&:join)

    expect(outcome).to be_failure
    expect(@waited).to be < 10 # gave up on the timeout, did not wait out the winner
  end

  it "leaves a caller's own lock_timeout alone when nested" do
    # SET LOCAL is transaction-scoped, not savepoint-scoped: a released savepoint
    # would leave our 3s bound in force for the rest of the caller's transaction.
    ActiveRecord::Base.transaction do
      before = ActiveRecord::Base.connection.select_value('SHOW lock_timeout')

      FixedSessions::Creator.new.call(data: create_params, user: user)

      expect(ActiveRecord::Base.connection.select_value('SHOW lock_timeout')).to eq(before)
    end
  end

  it 'gives up on a rival legacy upload rather than parking forever' do
    # SessionBuilder's mirror of the Creator bound below.
    data = legacy_session_data
    winner_started = Concurrent::CountDownLatch.new(1)
    loser_done = Concurrent::CountDownLatch.new(1)
    built = :never_ran

    winner = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        ActiveRecord::Base.transaction do
          SessionBuilder.new(data.dup, [], user).build!
          winner_started.count_down
          loser_done.wait(15)
        end
      end
    end

    loser = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        winner_started.wait(5)
        started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        built = SessionBuilder.new(data.dup, [], user).build!
        @waited = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
        loser_done.count_down
      end
    end

    [winner, loser].each(&:join)

    expect(built).to be_nil
    expect(@waited).to be < 10
  end

  it "leaves a caller's own lock_timeout alone on the legacy path too" do
    ActiveRecord::Base.transaction do
      before = ActiveRecord::Base.connection.select_value('SHOW lock_timeout')

      SessionBuilder.new(legacy_session_data, [], user).build!

      expect(ActiveRecord::Base.connection.select_value('SHOW lock_timeout')).to eq(before)
    end
  end

  describe 'recovering from a rival that commits mid-insert' do
    # Deterministic where the threaded examples above cannot be: the rival commits
    # in the window between this request's validation and its INSERT, so the
    # recovery path is guaranteed to run.
    it "answers the fixed create with the winner's session" do
      Device.create!(mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini')
      winner = nil
      rival = -> { winner = FixedSessions::Creator.new.call(data: create_params, user: user) }

      result = rival_commits_during_insert(FixedSession, rival) do
        FixedSessions::Creator.new.call(data: create_params, user: user)
      end

      expect(result).to be_success
      expect(result.value[:session].id).to eq(winner.value[:session].id)
      expect(Session.where('LOWER(uuid) = ?', uuid.downcase).count).to eq(1)
    end

    it "answers the legacy upload with the winner's session" do
      data = legacy_session_data
      winner = nil
      rival = -> { winner = SessionBuilder.new(data.dup, [], user).build! }

      built = rival_commits_during_insert(MobileSession, rival) do
        SessionBuilder.new(data.dup, [], user).build!
      end

      expect(built).to be_present
      expect(built.id).to eq(winner.id)
      expect(Session.where(uuid: uuid).count).to eq(1)
    end
  end

  describe 'recovering inside a caller\'s transaction' do
    # requires_new exists only for this: without a SAVEPOINT the constraint
    # violation poisons the caller's transaction and the recovery SELECT raises
    # PG::InFailedSqlTransaction instead of returning the winner's row.
    it 'answers the fixed create with the winner\'s session' do
      # The rival's find_or_create_device would otherwise block on the device row
      # this call has already inserted but not committed.
      Device.create!(mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini')

      winner = nil
      result = nil

      rival = -> { winner = FixedSessions::Creator.new.call(data: create_params, user: user) }

      rival_commits_during_insert(FixedSession, rival) do
        ActiveRecord::Base.transaction do
          result = FixedSessions::Creator.new.call(data: create_params, user: user)
        end
      end

      expect(result).to be_success
      expect(result.value[:session].id).to eq(winner.value[:session].id)
      expect(result.value[:session_token]).to eq(winner.value[:session_token])
      expect(Session.where('LOWER(uuid) = ?', uuid.downcase).count).to eq(1)
    end

    it 'answers the legacy upload with the winner\'s session' do
      data = legacy_session_data
      winner = nil
      built = nil

      rival = -> { winner = SessionBuilder.new(data.dup, [], user).build! }

      rival_commits_during_insert(MobileSession, rival) do
        ActiveRecord::Base.transaction do
          built = SessionBuilder.new(data.dup, [], user).build!
        end
      end

      expect(built).to be_present
      expect(built.id).to eq(winner.id)
      expect(Session.where('LOWER(uuid) = ?', uuid.downcase).count).to eq(1)
    end
  end
end
