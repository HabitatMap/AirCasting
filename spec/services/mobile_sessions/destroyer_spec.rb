require 'rails_helper'

describe MobileSessions::Destroyer do
  subject(:destroyer) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:mobile_session, user: user) }

  def measurement_on(stream)
    stream.build_measurements!(
      [{ time: Time.current, value: 1.0, latitude: 40.0, longitude: -74.0 }],
    )
  end

  it 'removes the session, its streams, measurements and notes' do
    stream = create(:stream, session: session)
    measurement_on(stream)
    create(:note, session: session)

    expect { destroyer.call(session: session) }
      .to change(Session, :count).by(-1)
      .and change(Stream, :count).by(-1)
      .and change(Measurement, :count).by(-1)
      .and change(Note, :count).by(-1)
  end

  it 'removes everything else hanging off the streams' do
    stream = create(:stream, session: session)
    create(:stream_daily_average, stream: stream)
    create(:fixed_measurement, stream: stream)
    create(:threshold_alert, stream: stream, user_id: user.id)
    create(:stream_hourly_average, stream: stream)

    expect { destroyer.call(session: session) }
      .to change(StreamDailyAverage, :count).by(-1)
      .and change(FixedMeasurement, :count).by(-1)
      .and change(ThresholdAlert, :count).by(-1)
      .and change(StreamHourlyAverage, :count).by(-1)
  end

  # streams.last_hourly_average_id has a foreign key onto stream_hourly_averages
  # (fk_rails_2786b4f29f), so the pointer has to be dropped before the row it
  # points at. Nothing puts hourly averages on a mobile stream today — they are
  # derived from fixed_measurements — but the cascade must not depend on that.
  it 'survives a stream that points at one of its own hourly averages' do
    stream = create(:stream, session: session)
    average = create(:stream_hourly_average, stream: stream)
    stream.update!(last_hourly_average_id: average.id)

    result = destroyer.call(session: session)

    expect(result).to be_success
    expect(Stream.where(id: stream.id)).to be_empty
    expect(StreamHourlyAverage.where(id: average.id)).to be_empty
  end

  it 'writes a tombstone so other devices learn of the deletion' do
    uuid = session.uuid

    expect { destroyer.call(session: session) }
      .to change(DeletedSession, :count).by(1)

    expect(DeletedSession.last).to have_attributes(uuid: uuid, user_id: user.id)
  end

  # Notes are destroyed rather than deleted in bulk, so has_one_attached's
  # after_destroy_commit purge runs and the S3 object goes with the note. The
  # legacy sync path (UserSessionsSyncing::Repository) uses delete_all here and
  # leaks every photo it touches; nothing reaps them.
  it 'detaches note photos so their blobs are purged' do
    note = create(:note, :with_photo, session: session)
    expect(note.s3_photo).to be_attached

    expect { destroyer.call(session: session) }
      .to change(ActiveStorage::Attachment, :count).by(-1)
  end

  it 'leaves another session of the same user alone' do
    other = create(:mobile_session, user: user)
    create(:stream, session: other)

    destroyer.call(session: session)

    expect(Session.where(id: other.id)).to exist
    expect(other.streams.count).to eq(1)
  end

  it 'returns the destroyed session' do
    result = destroyer.call(session: session)

    expect(result).to be_success
    expect(result.value[:session]).to eq(session)
  end

  describe 'when the database refuses the delete' do
    before do
      allow(session)
        .to receive(:destroy!)
        .and_raise(ActiveRecord::InvalidForeignKey, 'boom')
    end

    it 'answers internal_error rather than raising' do
      result = destroyer.call(session: session)

      expect(result).to be_failure
      expect(result.errors[:error_code]).to eq(MobileSessions::ErrorCodes::INTERNAL_ERROR)
    end

    it 'leaves the session and its data in place' do
      stream = create(:stream, session: session)
      measurement_on(stream)

      counts = -> { [Session.count, Stream.count, Measurement.count, DeletedSession.count] }

      expect { destroyer.call(session: session) }.not_to change(&counts)
    end
  end

  describe 'when a rival transaction holds the rows' do
    before do
      allow(session)
        .to receive(:destroy!)
        .and_raise(ActiveRecord::LockWaitTimeout, 'lock timeout')
    end

    it 'answers try_again_later' do
      result = destroyer.call(session: session)

      expect(result).to be_failure
      expect(result.errors[:error_code]).to eq(MobileSessions::ErrorCodes::TRY_AGAIN_LATER)
    end
  end
end
