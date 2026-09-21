require 'rails_helper'

describe FixedSessions::Destroyer do
  subject(:destroyer) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:fixed_session, user: user) }

  it 'removes the session, its streams and measurements' do
    stream = create(:stream, session: session)
    stream.build_measurements!(
      [{ time: Time.current, value: 1.0, latitude: 40.0, longitude: -74.0 }],
    )

    expect { destroyer.call(session: session) }
      .to change(Session, :count).by(-1)
      .and change(Stream, :count).by(-1)
      .and change(Measurement, :count).by(-1)
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

  # A fixed session is public, so another user may be alerting on its streams.
  # threshold_alerts.stream_id is a foreign key, so their alerts go too.
  it 'removes another user\'s alerts on the streams it deletes' do
    stream = create(:stream, session: session)
    create(:threshold_alert, stream: stream, user_id: create(:user).id)

    expect { destroyer.call(session: session) }
      .to change(ThresholdAlert, :count).by(-1)
  end

  # streams.last_hourly_average_id has a foreign key onto stream_hourly_averages
  # (fk_rails_2786b4f29f), so the pointer has to be dropped before the row it
  # points at. Every active fixed stream carries one.
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

  it 'leaves another session of the same user alone' do
    other = create(:fixed_session, user: user)
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
      expect(result.errors[:error_code])
        .to eq(FixedSessions::BinaryProtocol::ErrorCodes::INTERNAL_ERROR)
    end

    it 'leaves the session and its data in place' do
      stream = create(:stream, session: session)
      stream.build_measurements!(
        [{ time: Time.current, value: 1.0, latitude: 40.0, longitude: -74.0 }],
      )

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
      expect(result.errors[:error_code])
        .to eq(FixedSessions::BinaryProtocol::ErrorCodes::TRY_AGAIN_LATER)
    end
  end
end
