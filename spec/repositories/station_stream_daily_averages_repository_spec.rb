require 'rails_helper'

RSpec.describe StationStreamDailyAveragesRepository do
  subject { described_class.new }

  describe '#from_full_last_3_calendar_months' do
    it 'returns averages within the last 3 full calendar months for the stream' do
      station_stream = create(:station_stream)

      recent_1 = create(:station_stream_daily_average, station_stream: station_stream, date: 1.day.ago)
      recent_2 = create(:station_stream_daily_average, station_stream: station_stream, date: 2.days.ago)
      _old     = create(:station_stream_daily_average, station_stream: station_stream, date: 5.months.ago)

      result = subject.from_full_last_3_calendar_months(station_stream_id: station_stream.id)

      expect(result).to match_array([recent_1, recent_2])
    end

    it 'does not return averages belonging to a different stream' do
      config = create(:stream_configuration)
      stream_a = create(:station_stream, stream_configuration: config)
      stream_b = create(:station_stream, stream_configuration: config)

      create(:station_stream_daily_average, station_stream: stream_b, date: Date.current)
      own = create(:station_stream_daily_average, station_stream: stream_a, date: Date.current)

      result = subject.from_full_last_3_calendar_months(station_stream_id: stream_a.id)

      expect(result).to contain_exactly(own)
    end

    it 'returns results ordered by date ascending' do
      station_stream = create(:station_stream)

      avg_today     = create(:station_stream_daily_average, station_stream: station_stream, date: Date.current)
      avg_yesterday = create(:station_stream_daily_average, station_stream: station_stream, date: Date.current.prev_day)
      avg_2days_ago = create(:station_stream_daily_average, station_stream: station_stream, date: Date.current - 2)

      result = subject.from_full_last_3_calendar_months(station_stream_id: station_stream.id)

      expect(result.to_a).to eq([avg_2days_ago, avg_yesterday, avg_today])
    end

    it 'returns empty when the stream has no daily averages' do
      station_stream = create(:station_stream)

      expect(
        subject.from_full_last_3_calendar_months(station_stream_id: station_stream.id),
      ).to be_empty
    end
  end
end
