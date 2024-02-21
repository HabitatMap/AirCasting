require 'rails_helper'

describe StreamDailyAveragesRepository do
  subject { described_class.new }

  describe '#from_full_last_3_calendar_months' do
    it 'returns daily averages for given stream from full last 3 calendar months' do
      stream = create_stream!
      stream_daily_average1 =
        create_stream_daily_average!({ stream: stream, date: 1.day.ago })
      stream_daily_average2 =
        create_stream_daily_average!({ stream: stream, date: 2.days.ago })
      old_stream_daily_average =
        create_stream_daily_average!({ stream: stream, date: 5.months.ago })
      create_stream_daily_average!

      result = subject.from_full_last_3_calendar_months(stream_id: stream.id)

      expect(result).to match_array(
        [stream_daily_average1, stream_daily_average2],
      )
    end
  end
end
