require 'rails_helper'

RSpec.describe UserSessionsSyncing::Deleter do
  subject { described_class.new }

  describe '#call' do
    it 'deletes sessions and their dependencies' do
      user = create(:user)
      session = create(:fixed_session, user: user)
      stream = create(:stream, session: session)
      create_list(:measurement, 3, stream: stream)
      stream_hourly_average = create(:stream_hourly_average, stream: stream)
      stream.update(last_hourly_average: stream_hourly_average)
      create(:stream_daily_average, stream: stream)
      create(:threshold_alert, stream: stream, user: user)
      create_list(:note, 2, session: session)
      sessions = Session.where(id: session.id)

      result = subject.call(sessions: sessions)

      expect(Session.count).to eq(0)
      expect(Stream.count).to eq(0)
      expect(Measurement.count).to eq(0)
      expect(StreamHourlyAverage.count).to eq(0)
      expect(StreamDailyAverage.count).to eq(0)
      expect(ThresholdAlert.count).to eq(0)
      expect(Note.count).to eq(0)
    end
  end
end
