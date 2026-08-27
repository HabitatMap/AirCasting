require 'rails_helper'
require 'rake'

RSpec.describe 'sessions:deduplicate_mobile' do
  before(:all) do
    Rake.application.rake_require('tasks/deduplicate_mobile_sessions', [Rails.root.join('lib').to_s])
    Rake::Task.define_task(:environment)
  end

  let(:task) { Rake::Task['sessions:deduplicate_mobile'] }
  let(:user) { create(:user) }
  let(:uuid) { SecureRandom.uuid }
  let(:times) { [Time.utc(2026, 8, 1, 10, 0, 0), Time.utc(2026, 8, 1, 10, 1, 0)] }

  before { task.reenable }
  after { ENV.delete('APPLY') }

  # Duplicates cannot be created through validations — that is what the bug was.
  # Reproduce them the way the race did: two rows with the same uuid.
  def capture_stdout
    original = $stdout
    $stdout = StringIO.new
    yield
    $stdout.string
  ensure
    $stdout = original
  end

  def build_copy(measurement_times, uuid: self.uuid)
    session = build(
      :mobile_session,
      user: user, uuid: uuid, url_token: SecureRandom.hex(5), title: 'Ride',
      start_time_local: Time.utc(2026, 8, 1, 10, 0, 0), end_time_local: Time.utc(2026, 8, 1, 10, 30, 0)
    )
    session.save(validate: false)
    # older than MIN_AGE_DAYS, so the in-flight-measurements guard lets it through
    session.update_columns(created_at: 30.days.ago)
    stream = create(:stream, session: session, sensor_name: 'AirBeam2-PM2.5')
    measurement_times.each_with_index do |time, i|
      create(:measurement, stream: stream, time: time, time_with_time_zone: time, value: i)
    end
    stream.update!(measurements_count: measurement_times.size)
    session
  end

  context 'with identical copies' do
    it 'reports without deleting during a dry run' do
      keeper = build_copy(times)
      copy = build_copy(times)

      expect { task.invoke }.to output(/WOULD DELETE/).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end

    it 'keeps the oldest and deletes the rest when applied' do
      keeper = build_copy(times)
      copy = build_copy(times)
      ENV['APPLY'] = 'true'

      task.invoke

      expect(Session.where(uuid: uuid).pluck(:id)).to eq([keeper.id])
      expect(Stream.where(session_id: copy.id)).to be_empty
    end

    it "leaves the surviving session's measurements untouched" do
      keeper = build_copy(times)
      build_copy(times)
      ENV['APPLY'] = 'true'

      task.invoke

      expect(keeper.reload.streams.sum(&:measurements_count)).to eq(2)
      expect(Measurement.where(stream_id: keeper.streams.pluck(:id)).count).to eq(2)
    end

    it 'does not leave a tombstone that would make phones delete the survivor' do
      build_copy(times)
      build_copy(times)
      ENV['APPLY'] = 'true'

      task.invoke

      expect(DeletedSession.where(uuid: uuid, user_id: user.id)).to be_empty
    end

    context 'when the user had already deleted this session' do
      # A tombstone plus live copies means a concurrent sync re-uploaded the
      # session right after the delete. The user's deletion wins.
      # created before the sessions: the delete came first, the re-upload after
      before { DeletedSession.create!(uuid: uuid, user_id: user.id, created_at: 31.days.ago) }

      it 'removes every copy and keeps the tombstone' do
        build_copy(times)
        build_copy(times)
        ENV['APPLY'] = 'true'

        task.invoke

        expect(Session.where(uuid: uuid)).to be_empty
        expect(DeletedSession.where(uuid: uuid, user_id: user.id).count).to eq(1)
      end

      it 'reports it as an outright delete during a dry run' do
        build_copy(times)
        build_copy(times)

        expect { task.invoke }.to output(/WOULD DELETE ALL/).to_stdout
        expect(Session.where(uuid: uuid).count).to eq(2)
      end
    end
  end

  context 'when the copies are not identical' do
    it 'skips the group and deletes nothing' do
      keeper = build_copy(times)
      copy = build_copy(times + [Time.utc(2026, 8, 1, 10, 2, 0)])
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/SKIP/).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end
  end

  context 'safety guards' do
    it 'refuses to touch a uuid shared by two users' do
      # one user has the duplicate pair, a second user shares the uuid
      mine = build_copy(times)
      mine_again = build_copy(times)
      other_user = create(:user)
      theirs = build(:mobile_session, user: other_user, uuid: uuid, url_token: SecureRandom.hex(5))
      theirs.save(validate: false)
      theirs.update_columns(created_at: 30.days.ago)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/belongs to more than one user/).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([mine.id, mine_again.id, theirs.id])
    end

    it 'skips a group whose sessions predate their tombstone' do
      first = build_copy(times)
      build_copy(times)
      DeletedSession.create!(uuid: uuid, user_id: user.id, created_at: first.created_at + 1.hour)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/predate the tombstone/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)
    end

    it 'refuses to delete when the measurements differ despite matching counts' do
      keeper = build_copy(times)
      copy = build_copy(times)
      # same count and same first/last timestamp, different value in between
      Measurement.where(stream_id: copy.streams.first.id).order(:time).last.update!(value: 999)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/checksums differ/).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([keeper.id, copy.id])
    end
  end

  context 'groups where only some copies match' do
    # The earlier version deleted the matching copies and then asserted the group
    # was down to one row, which raised and killed the whole run.
    it 'leaves a three-copy group alone when one copy differs in shape' do
      a = build_copy(times)
      b = build_copy(times)
      c = build_copy(times)
      c.update_columns(title: 'renamed by the user')
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not identical to the keeper/).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([a.id, b.id, c.id])
    end

    it 'leaves a three-copy group alone when one copy fails the checksum' do
      a = build_copy(times)
      b = build_copy(times)
      c = build_copy(times)
      # same shape, same count, same first/last timestamp — different value inside
      Measurement.where(stream_id: c.streams.first.id).order(:time).last.update!(value: 999)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/checksums differ/).to_stdout

      expect(Session.where(uuid: uuid).pluck(:id)).to match_array([a.id, b.id, c.id])
    end

    it 'deletes all copies of a matching three-copy group' do
      keeper = build_copy(times)
      build_copy(times)
      build_copy(times)
      ENV['APPLY'] = 'true'

      task.invoke

      expect(Session.where(uuid: uuid).pluck(:id)).to eq([keeper.id])
    end

    it 'reports the checksum decision during a dry run, not only when applying' do
      build_copy(times)
      copy = build_copy(times)
      Measurement.where(stream_id: copy.streams.first.id).order(:time).last.update!(value: 999)

      expect { task.invoke }.to output(/checksums differ/).to_stdout
      expect { task.invoke }.not_to output(/WOULD DELETE/).to_stdout
    end

    it 'keeps going after a group raises, and processes later groups' do
      # first group blows up inside the transaction, second must still be handled
      build_copy(times)
      doomed = build_copy(times)
      other_uuid = SecureRandom.uuid
      good_keeper = build_copy(times, uuid: other_uuid)
      build_copy(times, uuid: other_uuid)

      allow(MobileSessionFingerprint).to receive(:destroy_session!).and_wrap_original do |original, session|
        raise StandardError, 'boom' if session.id == doomed.id

        original.call(session)
      end
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/StandardError: boom/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)               # rolled back
      expect(Session.where(uuid: other_uuid).pluck(:id)).to eq([good_keeper.id]) # still processed
    end

    it 'does not count a rolled-back group as deleted' do
      build_copy(times)
      doomed = build_copy(times)
      allow(MobileSessionFingerprint).to receive(:destroy_session!).and_raise(StandardError, 'boom')
      ENV['APPLY'] = 'true'

      output = capture_stdout { task.invoke }

      expect(output).to match(/sessions deleted:\s+0/)
      expect(output).to match(/measurements freed: 0/)
      expect(output).to match(/nothing was deleted for this group/)
      expect(Session.where(uuid: uuid).count).to eq(2)
      expect(doomed.reload).to be_present
    end
  end

  it 'detects an edit that only bumped the version' do
    a = build_copy(times)
    b = build_copy(times)
    b.update_columns(version: 5)
    ENV['APPLY'] = 'true'

    expect { task.invoke }.to output(/not identical to the keeper/).to_stdout

    expect(Session.where(uuid: uuid).pluck(:id)).to match_array([a.id, b.id])
  end

  describe 'share link healing' do
    it "bumps the keeper's version so phones re-download and pick up the surviving url_token" do
      keeper = build_copy(times)
      build_copy(times)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to change { keeper.reload.version }.by(1)
    end

    it 'leaves the version alone on a dry run' do
      keeper = build_copy(times)
      build_copy(times)

      expect { task.invoke }.not_to change { keeper.reload.version }
    end

    it 'does not bump a skipped group' do
      keeper = build_copy(times)
      copy = build_copy(times)
      copy.update_columns(title: 'renamed on the phone')

      ENV['APPLY'] = 'true'
      expect { task.invoke }.not_to change { keeper.reload.version }
    end
  end

  describe 'threshold alerts' do
    it 'skips a group when a copy carries an alert, instead of destroying it with the copy' do
      keeper = build_copy(times)
      copy = build_copy(times)
      alert = ThresholdAlert.create!(
        user: user, session_uuid: uuid, sensor_name: 'AirBeam2-PM2.5',
        stream_id: copy.streams.first.id, threshold_value: 10, frequency: 0, timezone_offset: 0
      )
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not identical/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)
      expect(alert.reload).to be_present
      expect(keeper.reload).to be_present
    end
  end

  describe 'notes' do
    it 'skips when two copies hold the same number of notes with different text' do
      keeper = build_copy(times)
      copy = build_copy(times)
      Note.create!(session: keeper, number: 0, text: 'windy', date: times.first, latitude: 1, longitude: 1)
      Note.create!(session: copy, number: 0, text: 'traffic', date: times.first, latitude: 1, longitude: 1)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not identical/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)
    end
  end

  describe 'selection' do
    it 'skips a group whose sessions are newer than MIN_AGE_DAYS' do
      build_copy(times)
      build_copy(times).update_columns(created_at: 1.day.ago)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/measurements may still be arriving/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)
    end

    it 'honours MIN_AGE_DAYS from the environment' do
      build_copy(times)
      build_copy(times)
      ENV['APPLY'] = 'true'
      ENV['MIN_AGE_DAYS'] = '90'

      expect { task.invoke }.to output(/measurements may still be arriving/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)
    ensure
      ENV.delete('MIN_AGE_DAYS')
    end

    it 'processes only the first LIMIT groups, oldest first' do
      build_copy(times)
      build_copy(times)
      second_uuid = SecureRandom.uuid
      build_copy(times, uuid: second_uuid)
      build_copy(times, uuid: second_uuid)
      ENV['APPLY'] = 'true'
      ENV['LIMIT'] = '1'

      task.invoke

      expect(Session.where(uuid: uuid).count).to eq(1)
      expect(Session.where(uuid: second_uuid).count).to eq(2)
    ensure
      ENV.delete('LIMIT')
    end

    it 'processes only the group named by UUID' do
      build_copy(times)
      build_copy(times)
      other_uuid = SecureRandom.uuid
      build_copy(times, uuid: other_uuid)
      build_copy(times, uuid: other_uuid)
      ENV['APPLY'] = 'true'
      ENV['UUID'] = other_uuid

      task.invoke

      expect(Session.where(uuid: other_uuid).count).to eq(1)
      expect(Session.where(uuid: uuid).count).to eq(2)
    ensure
      ENV.delete('UUID')
    end

    it 'refuses a uuid shared with a fixed session' do
      build_copy(times)
      build_copy(times)
      fixed = build(:fixed_session, user: user, uuid: uuid, url_token: SecureRandom.hex(5))
      fixed.save(validate: false)
      fixed.update_columns(created_at: 30.days.ago)
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/shared with a fixed session/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(3)
    end
  end

  describe 'edge cases the schema allows' do
    it 'deletes the copy even when the keeper carries a NULL version' do
      keeper = build_copy(times)
      copy = build_copy(times)
      Session.where(id: [keeper.id, copy.id]).update_all(version: nil)
      ENV['APPLY'] = 'true'

      task.invoke

      expect(Session.where(uuid: uuid).pluck(:id)).to eq([keeper.id])
      expect(keeper.reload.version).to eq(1) # NULL treated as 0, so the bump still lands
    end

    it 'skips when one copy holds a note photo and the other does not' do
      keeper = build_copy(times)
      copy = build_copy(times)
      [keeper, copy].each do |session|
        Note.create!(session: session, number: 0, text: 'same text',
                     date: times.first, latitude: 1, longitude: 1)
      end
      copy.notes.first.s3_photo.attach(
        io: StringIO.new('photo-bytes'), filename: 'note.jpg', content_type: 'image/jpeg',
      )
      ENV['APPLY'] = 'true'

      expect { task.invoke }.to output(/not identical/).to_stdout

      expect(Session.where(uuid: uuid).count).to eq(2)
      expect(copy.notes.first.s3_photo).to be_attached
    end

    it 'compares notes consistently when number is NULL on every note' do
      keeper = build_copy(times)
      copy = build_copy(times)
      [keeper, copy].each do |session|
        %w[alpha beta gamma].each do |text|
          Note.create!(session: session, number: nil, text: text,
                       date: times.first, latitude: 1, longitude: 1)
        end
      end
      ENV['APPLY'] = 'true'

      task.invoke

      expect(Session.where(uuid: uuid).pluck(:id)).to eq([keeper.id])
    end
  end

  describe 'dry run disclosure' do
    it 'names the version bump, so approving a dry run approves what apply does' do
      keeper = build_copy(times)
      build_copy(times)

      output = capture_stdout { task.invoke }

      expect(output).to match(/keeping ##{keeper.id} \(version 1 → 2\)/)
      expect(keeper.reload.version).to eq(1)
    end
  end
end
