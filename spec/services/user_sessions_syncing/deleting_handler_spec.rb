require 'rails_helper'

RSpec.describe UserSessionsSyncing::DeletingHandler do
  subject { described_class.new }

  describe '#call' do
    it 'deletes sessions and their dependencies' do
      user = create(:user)
      session = create(:fixed_session, user: user, uuid: 'abc123')
      other_session = create(:fixed_session, user: user, uuid: 'def456')
      stream = create(:stream, session: session)
      create_list(:measurement, 3, stream: stream)
      create_list(:fixed_measurement, 3, stream: stream)
      stream_hourly_average = create(:stream_hourly_average, stream: stream)
      stream.update(last_hourly_average: stream_hourly_average)
      create(:stream_daily_average, stream: stream)
      create(:threshold_alert, stream: stream, user: user)
      create_list(:note, 2, session: session)
      sessions_from_mobile_app = [
        { uuid: 'abc123', deleted: true, version: 1 },
        { uuid: 'def567', deleted: false, version: 1 },
      ]

      result =
        subject.call(
          sessions_from_mobile_app: sessions_from_mobile_app,
          user_id: user.id,
        )

      expect(result).to eq(['abc123'])
      expect(FixedSession.exists?(id: session.id)).to be false
      expect(FixedSession.exists?(id: other_session.id)).to be true
      expect(Stream.count).to eq(0)
      expect(Measurement.count).to eq(0)
      expect(FixedMeasurement.count).to eq(0)
      expect(StreamHourlyAverage.count).to eq(0)
      expect(StreamDailyAverage.count).to eq(0)
      expect(ThresholdAlert.count).to eq(0)
      expect(Note.count).to eq(0)
      deleted_session = DeletedSession.first
      expect(deleted_session.uuid).to eq(session.uuid)
      expect(deleted_session.user_id).to eq(user.id)
    end
  end
end
