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

  describe '#from_time_range' do
    it 'returns daily averages for given stream from time range' do
      stream = create_stream!
      stream_daily_average1 =
        create_stream_daily_average!({ stream: stream, date: 1.day.ago })
      stream_daily_average2 =
        create_stream_daily_average!({ stream: stream, date: 2.days.ago })
      old_stream_daily_average =
        create_stream_daily_average!({ stream: stream, date: 5.months.ago })
      create_stream_daily_average!

      result1 =
        subject.from_time_range(
          stream_id: stream.id,
          start_date: 3.days.ago,
          end_date: 1.day.ago,
        )

      expect(result1).to match_array(
        [stream_daily_average1, stream_daily_average2],
      )
    end
  end

  describe '#create_or_update' do
    context 'stream_daily_average for given stream and date does not exist' do
      it 'creates a new record' do
        stream = create_stream!
        current_date = Time.current.to_date

        expect {
          subject.create_or_update(
            stream_id: stream.id,
            date: current_date,
            value: 10,
          )
        }.to change(StreamDailyAverage, :count).by(1)

        stream_daily_average = StreamDailyAverage.first
        expect(stream_daily_average.stream_id).to eq(stream.id)
        expect(stream_daily_average.date).to eq(current_date)
        expect(stream_daily_average.value).to eq(10)
      end
    end

    context 'stream_daily_average for given stream and date exists' do
      it 'updates value for an existing record' do
        stream = create_stream!
        current_date = Time.current.to_date
        stream_daily_average =
          create_stream_daily_average!(
            { stream: stream, date: current_date, value: 20 },
          )

        expect {
          subject.create_or_update(
            stream_id: stream.id,
            date: current_date,
            value: 10,
          )
        }.to change(StreamDailyAverage, :count).by(0)

        expect(stream_daily_average.reload.value).to eq(10)
      end
    end
  end
end
