require 'rails_helper'

# What happens when two uploads for one session race — the only place the
# advisory lock, the lock_timeout and the re-read under the lock run for real
# rather than from a stub. Modelled on spec/models/session_uuid_race_spec.rb.
#
# use_transactional_tests must stay false. It sets lock_thread on the pool, which
# hands every thread the *same* connection: the threaded examples would then have
# no second session to race against, and the one that holds an advisory lock
# while another waits for it would deadlock against itself.
#
# The cost is manual teardown, which is why the `after` block deletes everything
# these examples create, innermost first.
RSpec.describe 'Concurrent mobile measurement ingest', type: :model do
  self.use_transactional_tests = false

  let!(:user) { create(:user) }
  let!(:threshold_set) { create(:threshold_set, :air_beam_pm2_5, :default) }
  let!(:session) do
    create(:mobile_session, user: user, time_zone: 'America/New_York',
                            start_time_local: Time.utc(2026, 8, 14, 12, 0, 0),
                            end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
  end
  let!(:stream) do
    create(:stream, session: session, threshold_set: threshold_set,
                    sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2)
  end

  let(:monitor) do
    instance_double(
      ::BinaryProtocol::Monitor,
      report_parse_error: nil,
      report_unknown_sensor_type: nil,
      report_import_failure: nil,
      report_transaction_error: nil,
    )
  end

  let(:epoch) { Time.utc(2026, 8, 14, 10, 0, 0).to_i }

  after do
    # Nothing here is rolled back for us, and destroying a session writes a
    # `deleted_sessions` tombstone that other examples read — clear it too.
    session.streams.each { |s| s.measurements.delete_all }
    session.streams.delete_all
    session.destroy
    DeletedSession.where(uuid: session.uuid).delete_all
    threshold_set.destroy if threshold_set&.persisted?
  ensure
    # Last, and in an ensure: a raise in any cleanup above would otherwise leave
    # the user behind, and nothing rolls it back for us.
    user.destroy if user&.persisted?
  end

  def ingester
    MobileSessions::BinaryProtocol::Ingester.new(monitor: monitor)
  end

  def frame(epoch:, value:, lat:, lng:, type_id: 2)
    [epoch, type_id, value, lat, lng].pack('NCgGG')
  end

  def payload(frames)
    header = ["\xAB\xBA", frames.size].pack('a2n')
    body = header + frames.join
    body + [body.bytes.inject(0, :^)].pack('C')
  end

  def in_own_connection
    Thread.new { ActiveRecord::Base.connection_pool.with_connection { yield } }
  end

  it 'stores one row per timestamp when both uploads carry the same frames' do
    binary = payload([
      frame(epoch: epoch, value: 10.0, lat: 40.0, lng: -74.0),
      frame(epoch: epoch + 1, value: 11.0, lat: 40.1, lng: -74.1),
    ])
    barrier = Concurrent::CountDownLatch.new(2)

    threads = 2.times.map do
      in_own_connection do
        barrier.count_down
        barrier.wait(5)
        ingester.call(session: session, binary: binary)
      end
    end
    threads.each(&:join)

    # Without the advisory lock both uploads read "absent" and both insert:
    # `measurements` carries no unique constraint to catch it.
    expect(stream.measurements.count).to eq(2)
    expect(stream.reload.measurements_count).to eq(2)
  end

  describe 'a rival that commits after the stream was resolved' do
    # The stream is loaded before the advisory lock is taken. This drives a rival
    # upload to completion in exactly that window, so the lock is already stale
    # when we acquire it — deterministic, no thread timing.
    def rival_commits_after_stream_resolved(rival)
      fired = false
      allow_any_instance_of(StreamsRepository)
        .to receive(:find_by_session_id_and_sensor_type_id).and_wrap_original do |original, **kwargs|
          resolved = original.call(**kwargs)
          unless fired
            fired = true
            in_own_connection { rival.call }.join
          end
          resolved
        end

      yield
    end

    it 'folds into the row as it stands under the lock, not the copy read before it' do
      rival_binary = payload([
        frame(epoch: epoch, value: 10.0, lat: 10.0, lng: -70.0),
        frame(epoch: epoch + 1, value: 10.0, lat: 10.0, lng: -70.0),
        frame(epoch: epoch + 2, value: 10.0, lat: 10.0, lng: -70.0),
      ])
      ours = payload([frame(epoch: epoch + 10, value: 30.0, lat: 12.0, lng: -68.0)])

      rival_commits_after_stream_resolved(-> { ingester.call(session: session, binary: rival_binary) }) do
        ingester.call(session: session, binary: ours)
      end

      stream.reload
      expect(stream.measurements_count).to eq(4)
      # (10.0 * 3 + 30.0) / 4. Folding into the pre-lock copy would weight our
      # value against a count of zero and answer 30.0.
      expect(stream.average_value).to be_within(0.001).of(15.0)
      # The rival's corner of the box survives; the pre-lock copy had no bounds
      # at all, so widening from it would have thrown the rival's away.
      expect(stream.min_latitude).to be_within(1e-6).of(10.0)
      expect(stream.max_latitude).to be_within(1e-6).of(12.0)
      expect(stream.min_longitude).to be_within(1e-6).of(-70.0)
      expect(stream.max_longitude).to be_within(1e-6).of(-68.0)
    end

    it "widens the session's bounds from the row as it stands, not the copy we were handed" do
      # Two uploads on *different* streams of one session take different advisory
      # locks, so they never meet — the session row is the one thing they share.
      other_stream = create(:stream, session: session, threshold_set: threshold_set,
                                     sensor_name: 'AirBeamMini-RH', sensor_type_id: 3)
      rival_binary = payload([frame(epoch: epoch - 3600, type_id: other_stream.sensor_type_id,
                                    value: 10.0, lat: 40.0, lng: -74.0)])
      ours = payload([frame(epoch: epoch, value: 30.0, lat: 40.0, lng: -74.0)])

      # Its own instance, as a second request would have: sharing ours would hand
      # us the rival's bounds in memory and hide the very thing under test.
      rival = -> { ingester.call(session: Session.find(session.id), binary: rival_binary) }

      rival_commits_after_stream_resolved(rival) do
        ingester.call(session: session, binary: ours)
      end

      session.reload
      # The rival pushed the start back an hour while we held a copy that still
      # read 12:00. Folding into that copy writes our own 10:00 over it.
      expect(session.start_time_local).to eq(Utils.to_local_as_utc(Time.at(epoch - 3600), session.time_zone))
      expect(session.end_time_local).to eq(Time.utc(2026, 8, 14, 12, 0, 0))
    end
  end

  it 'gives up on a rival holding the stream rather than parking forever' do
    # Nothing in the server config or database.yml sets lock_timeout, so without
    # SET LOCAL an upload meeting another one's advisory lock waits for that
    # transaction with no bound, holding a puma thread.
    namespace = MobileSessions::BinaryProtocol::Ingester::ADVISORY_LOCK_NAMESPACE
    holder_started = Concurrent::CountDownLatch.new(1)
    loser_done = Concurrent::CountDownLatch.new(1)
    outcome = nil
    waited = nil

    holder = in_own_connection do
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute(
          "SELECT pg_advisory_xact_lock(#{namespace}, #{stream.id})",
        )
        holder_started.count_down
        loser_done.wait(15) # hold it
      end
    end

    loser = in_own_connection do
      holder_started.wait(5)
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      outcome = ingester.call(
        session: session,
        binary: payload([frame(epoch: epoch, value: 1.0, lat: 40.0, lng: -74.0)]),
      )
      waited = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started
      loser_done.count_down
    end

    [holder, loser].each(&:join)

    expect(outcome).to be_failure
    expect(outcome.errors[:message]).to eq('Could not store these measurements, please retry')
    expect(waited).to be < 10 # gave up on the timeout, did not wait out the holder
    expect(stream.measurements.count).to eq(0)
  end

  it "leaves a caller's own lock_timeout alone when nested" do
    # SET LOCAL is transaction-scoped, not savepoint-scoped: a released savepoint
    # would leave our 3s bound in force for the rest of the caller's transaction.
    ActiveRecord::Base.transaction do
      before = ActiveRecord::Base.connection.select_value('SHOW lock_timeout')

      ingester.call(
        session: session,
        binary: payload([frame(epoch: epoch, value: 1.0, lat: 40.0, lng: -74.0)]),
      )

      expect(ActiveRecord::Base.connection.select_value('SHOW lock_timeout')).to eq(before)
    end
  end

  it 'bounds the wait before taking the first lock' do
    statements = []
    allow(ActiveRecord::Base.connection).to receive(:execute).and_wrap_original do |original, sql, *args|
      statements << sql
      original.call(sql, *args)
    end

    ingester.call(
      session: session,
      binary: payload([frame(epoch: epoch, value: 1.0, lat: 40.0, lng: -74.0)]),
    )

    expected = "SET LOCAL lock_timeout = '#{MobileSessions::BinaryProtocol::Ingester::LOCK_TIMEOUT}'"
    timeout = statements.index { |sql| sql.include?(expected) }
    lock = statements.index { |sql| sql.include?('pg_advisory_xact_lock') }
    expect(timeout).not_to be_nil
    expect(lock).not_to be_nil
    expect(timeout).to be < lock
  end
end
