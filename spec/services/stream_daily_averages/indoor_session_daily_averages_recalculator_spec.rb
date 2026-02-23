require 'rails_helper'

describe StreamDailyAverages::IndoorSessionDailyAveragesRecalculator do
  subject { described_class.new(sleep_between_batches: 0) }

  describe '#call' do
    it 'calculates the daily average for indoor session streams' do
      stream = create(:stream, :fixed, session: create(:fixed_session, is_indoor: true))

      create(
        :fixed_measurement,
        stream: stream,
        value: 20,
        time_with_time_zone: Time.parse('2025-01-15 06:00:00 UTC'),
      )
      create(
        :fixed_measurement,
        stream: stream,
        value: 40,
        time_with_time_zone: Time.parse('2025-01-15 18:00:00 UTC'),
      )

      subject.call

      avg = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-15'))
      expect(avg).to be_present
      expect(avg.value).to eq(30)
    end

    it 'upserts: updates an existing record instead of creating a duplicate' do
      stream = create(:stream, :fixed, session: create(:fixed_session, is_indoor: true))
      existing = create(
        :stream_daily_average,
        stream: stream,
        date: Date.parse('2025-01-15'),
        value: 999,
      )
      create(
        :fixed_measurement,
        stream: stream,
        value: 50,
        time_with_time_zone: Time.parse('2025-01-15 12:00:00 UTC'),
      )

      expect { subject.call }.not_to change(StreamDailyAverage, :count)
      expect(existing.reload.value).to eq(50)
    end

    it 'does not process streams from non-indoor fixed sessions' do
      indoor_stream = create(:stream, :fixed, session: create(:fixed_session, is_indoor: true))
      outdoor_stream = create(:stream, :fixed, session: create(:fixed_session, is_indoor: false))

      create(
        :fixed_measurement,
        stream: indoor_stream,
        value: 10,
        time_with_time_zone: Time.parse('2025-01-15 10:00:00 UTC'),
      )
      create(
        :fixed_measurement,
        stream: outdoor_stream,
        value: 20,
        time_with_time_zone: Time.parse('2025-01-15 11:00:00 UTC'),
      )

      subject.call

      expect(StreamDailyAverage.where(stream: indoor_stream).count).to eq(1)
      expect(StreamDailyAverage.where(stream: outdoor_stream).count).to eq(0)
    end

    context 'day boundary' do
      # The interval is open at the start and closed at the end:
      # day D = (00:00:00 of D, 00:00:00 of D+1]
      # A measurement at exactly 00:00:00 belongs to the PREVIOUS day.
      it 'assigns midnight to the previous day and one second past midnight to the current day' do
        stream = create(:stream, :fixed, session: create(:fixed_session, is_indoor: true))

        # Exactly midnight Jan 15 → belongs to Jan 14
        create(
          :fixed_measurement,
          stream: stream,
          value: 100,
          time_with_time_zone: Time.parse('2025-01-15 00:00:00 UTC'),
        )
        # One second past midnight Jan 15 → belongs to Jan 15
        create(
          :fixed_measurement,
          stream: stream,
          value: 20,
          time_with_time_zone: Time.parse('2025-01-15 00:00:01 UTC'),
        )
        # Exactly midnight Jan 16 → still belongs to Jan 15 (closed end)
        create(
          :fixed_measurement,
          stream: stream,
          value: 40,
          time_with_time_zone: Time.parse('2025-01-16 00:00:00 UTC'),
        )

        subject.call

        jan_14 = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-14'))
        jan_15 = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-15'))

        expect(jan_14.value).to eq(100)  # only the midnight measurement
        expect(jan_15.value).to eq(30)   # (20 + 40) / 2 = 30
      end
    end
  end
end
