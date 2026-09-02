require 'rails_helper'
require './lib/session_builder'
require 'sidekiq/testing'

describe SessionBuilder do
  around do |example|
    Sidekiq::Testing.inline! { example.run }
  end
  let(:user) { create_user! }

  subject { SessionBuilder.new(session_data, [], user) }
  let(:session_data) do
    {
      is_indoor: false,
      uuid: '32B8C8C9-D0A2-46F4-8644-7E11B31CFDFF',
      tag_list: '',
      longitude: 19.9256620467129,
      start_time: '2024-05-23T13:58:33.000Z',
      title: 'Mic 123',
      notes: [],
      deleted: false,
      type: 'MobileSession',
      streams: {
        'Phone Microphone' => {
          measurement_type: 'Sound Level',
          threshold_high: 80,
          unit_name: 'decibels',
          threshold_very_high: 100,
          measurement_short_type: 'db',
          deleted: false,
          threshold_very_low: 20,
          measurements: [
            {
              longitude: 19.925760220380383,
              time: '2024-05-23T13:58:34.000Z',
              latitude: 50.0583582102866,
              milliseconds: 0,
              value: 20.86663818359375,
            },
            {
              milliseconds: 0,
              value: 38.978153228759766,
              latitude: 50.0583582102866,
              longitude: 19.925760220380383,
              time: '2024-05-23T13:58:33.000Z',
            },
          ],
          sensor_package_name: 'Builtin',
          unit_symbol: 'dB',
          sensor_name: 'Phone Microphone',
          threshold_low: 60,
          threshold_medium: 70,
        },
      },
      version: 0,
      end_time: '2024-05-23T13:58:40.000Z',
      contribute: true,
      latitude: 50.058385349704686,
    }
  end

  it 'builds a session with streams and measurements' do
    expect { subject.build! }.to change { Session.count }.by(1).and change {
                                     Stream.count
                                   }.by(1).and change { Measurement.count }.by(
                                                                   2,
                                                                 )
  end

  describe 'time_zone' do
    it 'derives the time zone from coordinates when none is provided' do
      allow(TimeZoneFinderWrapper.instance)
        .to receive(:time_zone_at).and_return('Europe/Warsaw')

      subject.build!

      expect(TimeZoneFinderWrapper.instance)
        .to have_received(:time_zone_at)
        .with(lat: session_data[:latitude], lng: session_data[:longitude])
      expect(Session.last.time_zone).to eq('Europe/Warsaw')
    end

    context 'when a valid time_zone is provided' do
      let(:session_data) { super().merge(time_zone: 'America/New_York') }

      it 'keeps it and skips deriving the session zone from coordinates' do
        allow(TimeZoneFinderWrapper.instance)
          .to receive(:time_zone_at).and_call_original

        subject.build!

        expect(Session.last.time_zone).to eq('America/New_York')
        expect(TimeZoneFinderWrapper.instance)
          .not_to have_received(:time_zone_at)
          .with(lat: session_data[:latitude], lng: session_data[:longitude])
      end
    end

    context 'when an invalid time_zone is provided' do
      let(:session_data) { super().merge(time_zone: 'Not/AZone') }

      it 'falls back to deriving it from coordinates' do
        allow(TimeZoneFinderWrapper.instance)
          .to receive(:time_zone_at).and_return('Europe/Warsaw')

        subject.build!

        expect(Session.last.time_zone).to eq('Europe/Warsaw')
      end
    end
  end

  describe '.normalize_tags' do
    it 'replaces spaces and commas with commas as tag delimiters' do
      expect(SessionBuilder.normalize_tags('jola misio, foo')).to eq(
        'jola,misio,foo',
      )
    end
  end

  describe '.prepare_notes' do
    it 'returns notes unchanged when photos are blank' do
      notes = [{ note: 'first' }, { note: 'second' }]
      result = SessionBuilder.prepare_notes(notes, [nil, ''])

      expect(result).to eq([{ note: 'first' }, { note: 'second' }])
    end

    it 'attaches photo as ActiveStorage blob when photo is present' do
      # Minimal valid 1x1 red PNG image in base64
      png_base64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
      notes = [{ note: 'with photo' }]

      result = SessionBuilder.prepare_notes(notes, [png_base64])

      expect(result.first[:note]).to eq('with photo')
      expect(result.first[:s3_photo]).to be_a(ActiveStorage::Blob)
    end
  end

  describe 'when a concurrent upload of the same uuid won the race' do
    # Real races are covered by spec/models/session_uuid_race_spec.rb with two
    # threads. Here the constraint violation is forced, so each branch of the
    # recovery can be asserted exactly — the validation would otherwise reject this
    # payload before the insert, which is the separate case asserted below.
    def force_race
      allow(Session).to receive(:create!)
        .and_raise(ActiveRecord::RecordNotUnique, 'duplicate key value violates unique constraint')
    end

    let!(:winner) do
      SessionBuilder.new(session_data.deep_dup, [], user).build!
    end

    it "returns the winner's session instead of writing a second copy" do
      force_race

      built = SessionBuilder.new(session_data.deep_dup, [], user).build!

      expect(built.id).to eq(winner.id)
      expect(Session.where(uuid: session_data[:uuid]).count).to eq(1)
    end

    it 'does not enqueue the losing payload, so measurements are not doubled' do
      before_count = Measurement.where(stream_id: winner.streams.select(:id)).count
      force_race

      expect(MeasurementsCreator).not_to receive(:new)
      SessionBuilder.new(session_data.deep_dup, [], user).build!

      expect(Measurement.where(stream_id: winner.streams.select(:id)).count).to eq(before_count)
      expect(winner.streams.count).to eq(1)
    end

    it 'keeps the "uuid taken" failure when nothing was raced' do
      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
      expect(Session.where(uuid: session_data[:uuid]).count).to eq(1)
    end

    it "refuses a uuid another user already owns, without a race" do
      # The uniqueness validation is global, not scoped to the user, so this is
      # rejected before any insert — the same answer it gave before this work.
      winner.update_columns(user_id: create_user!(email: 'owner@example.com').id)

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
      expect(Session.where(uuid: session_data[:uuid]).count).to eq(1)
    end

    it 'never hands back an old session, however well it matches' do
      # The recovery path can only be reached when the rival row was committed
      # between this request's uniqueness SELECT and its INSERT. A row that already
      # existed is caught by the validation — LOWER(uuid) = LOWER(?), the same
      # predicate as the index — so a re-upload months later still gets its 400
      # rather than being handed the earlier recording.
      winner.update_columns(created_at: 6.months.ago, updated_at: 6.months.ago)

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
      expect(Session.where(uuid: session_data[:uuid]).count).to eq(1)
    end

    it 'refuses an old session re-uploaded under a different case' do
      # The one way an old row could reach reusable_session: if the validation
      # stopped matching the index. The validation is LOWER(uuid) = LOWER(?) and the
      # index is UNIQUE (LOWER(uuid)); make either side case-sensitive and this
      # upload slips past the validation, hits the constraint, and is handed a
      # months-old recording instead of a 400.
      winner.update_columns(created_at: 6.months.ago)
      recased = session_data.deep_dup
      recased[:uuid] = session_data[:uuid].swapcase

      expect(SessionBuilder.new(recased, [], user).build!).to be_nil
      expect(Session.where('LOWER(uuid) = ?', session_data[:uuid].downcase).count).to eq(1)
    end

    it 'reaches the recovery path only through a constraint violation' do
      # If the validation ever stopped matching the index — a case-sensitivity
      # change on either side — old rows would start flowing into reusable_session.
      expect_any_instance_of(SessionBuilder).not_to receive(:reusable_session)

      SessionBuilder.new(session_data.deep_dup, [], user).build!
    end

    it 'refuses a row holding a different recording under the same uuid' do
      force_race
      winner.update_columns(title: 'a completely different ride')

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end

    it 'refuses a row differing in any field the payload also carries' do
      %i[contribute is_indoor time_zone].each do |field|
        winner.reload
        original = winner.public_send(field)
        changed = field == :time_zone ? 'America/New_York' : !original

        force_race
        winner.update_columns(field => changed)
        expect(SessionBuilder.new(session_data.deep_dup, [], user).build!)
          .to(be_nil, "expected a differing #{field} to be refused")

        winner.update_columns(field => original)
      end
    end

    it 'refuses a row bound to a device the payload does not name' do
      force_race
      device = Device.create!(mac_address: 'AA:11:BB:22:CC:33', model: 'AirBeam3')
      winner.update_columns(device_id: device.id)

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end

    it 'refuses a row whose tags differ' do
      force_race
      winner.tag_list = 'somebody-elses-tag'
      winner.save!

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end

    it 'still matches when a tag is repeated in the payload' do
      # normalize_tags turns "beach beach" into "beach,beach"; the stored row reads
      # back one tagging. TagList dedups on assignment today, so this guards the
      # comparison against that gem detail changing.
      repeated = session_data.deep_dup
      repeated[:tag_list] = 'beach beach'
      winner.tag_list = 'beach'
      winner.save!
      force_race

      expect(SessionBuilder.new(repeated, [], user).build!&.id).to eq(winner.id)
    end

    it 'still matches when the payload carries sub-second precision' do
      # TimeToLocalInUTC#convert formats with %FT%T, dropping any fraction, and it
      # runs on both the stored row and the comparison object. A change there would
      # start rejecting uploads whose timestamps carry more precision than the
      # column keeps, with nothing in the logs to explain the 400.
      precise = session_data.deep_dup
      precise[:start_time] = '2024-05-23T13:58:33.123456789Z'
      force_race

      expect(SessionBuilder.new(precise, [], user).build!&.id).to eq(winner.id)
    end

    it 'refuses a row whose times differ from the payload' do
      force_race
      winner.update_columns(end_time_local: winner.end_time_local + 5.minutes)

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end

    it 'refuses a device-bound row, so two AirBeams cannot report into one session' do
      force_race
      winner.update_columns(type: 'FixedSession', session_token: SecureRandom.hex(16))
      session_data[:type] = 'FixedSession'

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end

    it 'ignores a session of another type holding the same uuid' do
      force_race
      winner.update_columns(type: 'FixedSession')

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end

    it 'never returns another user\'s session' do
      force_race
      winner.update_columns(user_id: create_user!(email: 'someone-else@example.com').id)

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end
  end

  describe 'when the database refuses a duplicate uuid' do
    it 'answers 400 rather than raising, once a unique index exists' do
      allow(Session).to receive(:create!).and_raise(
        ActiveRecord::RecordNotUnique, 'duplicate key value violates unique constraint',
      )

      expect(SessionBuilder.new(session_data.deep_dup, [], user).build!).to be_nil
    end
  end
end
