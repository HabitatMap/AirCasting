require 'rails_helper'
require 'rake'

# The conversion is the whole point of this task, and the one thing that cannot be
# eyeballed: `end_time_local` is a naive wall clock (Session exempts it from
# time-zone conversion, so the stored value is "13:58:40, wherever the device
# was"), while `finished_at` is a timestamptz — a real instant. Getting it wrong
# is silent and systematic per region, up to ±14h against a 24h threshold.
describe 'sessions:backfill_finished_at' do
  before(:all) do
    Rails.application.load_tasks unless
      Rake::Task.task_defined?('sessions:backfill_finished_at')
  end

  # Returns what the task printed. The progress report is the operator's only
  # view of a long run, so it is asserted rather than merely swallowed.
  def run_task(env = {})
    env.each { |key, value| ENV[key.to_s] = value.to_s }

    # stderr too: the pre-flight guards exit via `abort`, which prints there.
    original_stdout, original_stderr = $stdout, $stderr
    captured = StringIO.new
    $stdout = captured
    $stderr = StringIO.new
    begin
      Rake::Task['sessions:backfill_finished_at'].reenable
      Rake::Task['sessions:backfill_finished_at'].invoke
      captured.string
    ensure
      $stdout, $stderr = original_stdout, original_stderr
      env.each_key { |key| ENV.delete(key.to_s) }
    end
  end

  # end_time_local is assigned as a bare string so the spec states the stored
  # numerals outright, rather than depending on what zone a Time object carried.
  def mobile_session(end_time_local, time_zone)
    create(
      :mobile_session,
      end_time_local: end_time_local,
      time_zone: time_zone,
    )
  end

  describe 'the time-zone conversion' do
    it 'reads the wall clock in the session zone, at the offset in force that day' do
      # Europe/Warsaw is UTC+2 in May (CEST) and UTC+1 in January (CET). Both
      # asserted, because a hard-coded offset passes one and fails the other.
      summer = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      winter = mobile_session('2024-01-15 13:58:40', 'Europe/Warsaw')

      run_task

      expect(summer.reload.finished_at).to eq(Time.utc(2024, 5, 23, 11, 58, 40))
      expect(winter.reload.finished_at).to eq(Time.utc(2024, 1, 15, 12, 58, 40))
    end

    it 'converts west of UTC in the other direction' do
      # America/Los_Angeles is UTC-7 in May, so the instant is *later* than the
      # wall clock. Catches a sign error, which UTC+n sessions alone would hide.
      session = mobile_session('2024-05-23 13:58:40', 'America/Los_Angeles')

      run_task

      expect(session.reload.finished_at).to eq(Time.utc(2024, 5, 23, 20, 58, 40))
    end

    it 'carries the instant back across the date line' do
      # Pacific/Auckland is UTC+12 in May, so a session that ended early on the
      # 23rd locally finished on the 22nd in UTC. A conversion that only shifts
      # hours-within-the-day would land on the wrong calendar day.
      session = mobile_session('2024-05-23 01:00:00', 'Pacific/Auckland')

      run_task

      expect(session.reload.finished_at).to eq(Time.utc(2024, 5, 22, 13, 0, 0))
    end

    it 'leaves a UTC session at its wall-clock value' do
      session = mobile_session('2024-05-23 13:58:40', 'UTC')

      run_task

      expect(session.reload.finished_at).to eq(Time.utc(2024, 5, 23, 13, 58, 40))
    end

    it 'does not store the wall clock as if it were already UTC' do
      # The failure mode this task exists to avoid: assigning end_time_local
      # straight across. Stated as its own expectation so the diff names it.
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')

      run_task

      expect(session.reload.finished_at).not_to eq(Time.utc(2024, 5, 23, 13, 58, 40))
    end
  end

  describe 'what it touches' do
    it 'finishes mobile sessions and leaves fixed ones alone' do
      mobile = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      fixed = create(:fixed_session, end_time_local: '2024-05-23 13:58:40')

      run_task

      expect(mobile.reload.finished_at).to be_present
      expect(fixed.reload.finished_at).to be_nil
    end

    it 'skips a session that has no end time to convert' do
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      session.update_column(:end_time_local, nil)

      run_task

      expect(session.reload.finished_at).to be_nil
    end

    it 'leaves an already-finished session untouched, so a resumed run is safe' do
      # finished_at IS NULL is the resume token: the UPDATE removes the predicate
      # that matched it. A second pass must therefore be a no-op, not a rewrite.
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      declared = Time.utc(2020, 1, 1, 12, 0, 0)
      session.update_column(:finished_at, declared)

      run_task

      expect(session.reload.finished_at).to eq(declared)
    end

    it 'does not bump version or updated_at' do
      # version is the mobile sync token — bumping it would push every backfilled
      # session to every syncing client.
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      session.update_columns(version: 7, updated_at: Time.utc(2020, 1, 1))

      run_task

      session.reload
      expect(session.finished_at).to eq(Time.utc(2024, 5, 23, 11, 58, 40))
      expect(session.version).to eq(7)
      expect(session.updated_at).to eq(Time.utc(2020, 1, 1))
    end
  end

  describe 'the operator controls' do
    it 'writes nothing under DRY_RUN' do
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')

      run_task('DRY_RUN' => '1')

      expect(session.reload.finished_at).to be_nil
    end

    it 'stops at MAX_ID, so the canary run is actually bounded' do
      first = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      last = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')

      run_task('MAX_ID' => first.id)

      expect(first.reload.finished_at).to be_present
      expect(last.reload.finished_at).to be_nil
    end

    it 'counts against the bounded total, not the whole table' do
      # The progress report is derived from the same relation the run iterates.
      # When the two were computed separately, a bounded run reported a
      # percentage against every row in the table and never reached 100% — a
      # silent wrongness for the whole run, which no state assertion would catch.
      first = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      2.times { mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw') }

      output = run_task('MAX_ID' => first.id)

      expect(output).to include('1 mobile sessions to finish')
      expect(output).to include('1/1 (100.0%)')
      expect(output).to include('Finished 1 sessions')
    end

    it 'reports progress against the real total on an unbounded run' do
      3.times { mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw') }

      output = run_task('BATCH_SIZE' => 2)

      expect(output).to include('3 mobile sessions to finish')
      expect(output).to include('2/3 (66.7%)')
      expect(output).to include('3/3 (100.0%)')
      expect(output).to include('Finished 3 sessions')
    end

    it 'refuses an empty MAX_ID rather than silently bounding the run to nothing' do
      # "".to_i is 0, which would cap the run at id 0, write nothing, and report
      # success.
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')

      expect { run_task('MAX_ID' => '') }.to raise_error(SystemExit)

      expect(session.reload.finished_at).to be_nil
    end

    it 'refuses a LOCK_TIMEOUT that is not a Postgres interval' do
      # It is interpolated into SET, which takes no bind parameters.
      session = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')

      expect { run_task('LOCK_TIMEOUT' => "3s'; DROP TABLE sessions; --") }
        .to raise_error(SystemExit)

      expect(session.reload.finished_at).to be_nil
      expect(Session.table_exists?).to eq(true)
    end

    it 'aborts on a time zone Postgres does not recognise, before writing anything' do
      # An unrecognised zone raises mid-batch and leaves the run half done. The
      # pre-flight turns that into a refusal to start.
      good = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      bad = mobile_session('2024-05-23 13:58:40', 'Europe/Warsaw')
      bad.update_column(:time_zone, 'Not/AZone')

      expect { run_task }.to raise_error(SystemExit)

      expect(good.reload.finished_at).to be_nil
      expect(bad.reload.finished_at).to be_nil
    end
  end
end
