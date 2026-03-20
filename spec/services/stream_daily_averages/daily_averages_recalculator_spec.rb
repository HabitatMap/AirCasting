require 'rails_helper'

describe StreamDailyAverages::DailyAveragesRecalculator do
  subject { described_class.new(sleep_between_batches: 0) }

  describe '#call' do
    context 'fixed session is_indoor: true (time and time_with_time_zone are both UTC)' do
      let(:stream) { create(:stream, :fixed, session: create(:fixed_session, is_indoor: true)) }

      it 'calculates the daily average' do
        create(
          :fixed_measurement,
          stream: stream,
          value: 20,
          time: Time.parse('2025-01-15 06:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 06:00:00 UTC'),
        )
        create(
          :fixed_measurement,
          stream: stream,
          value: 40,
          time: Time.parse('2025-01-15 18:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 18:00:00 UTC'),
        )

        subject.call(stream_ids: [stream.id])

        avg = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-15'))
        expect(avg).to be_present
        expect(avg.value).to eq(30)
      end

      it 'rounds a 0.5 average up' do
        create(
          :fixed_measurement,
          stream: stream,
          value: 4,
          time: Time.parse('2025-01-15 06:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 06:00:00 UTC'),
        )
        create(
          :fixed_measurement,
          stream: stream,
          value: 5,
          time: Time.parse('2025-01-15 18:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 18:00:00 UTC'),
        )

        subject.call(stream_ids: [stream.id])

        avg = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-15'))
        expect(avg.value).to eq(5) # avg = 4.5, must round up, not to 4
      end

      it 'upserts: updates an existing record instead of creating a duplicate' do
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
          time: Time.parse('2025-01-15 12:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 12:00:00 UTC'),
        )

        expect { subject.call(stream_ids: [stream.id]) }.not_to change(StreamDailyAverage, :count)
        expect(existing.reload.value).to eq(50)
      end

      context 'day boundary' do
        # The interval is open at the start and closed at the end:
        # day D = (00:00:00 of D, 00:00:00 of D+1]
        # A measurement at exactly 00:00:00 belongs to the PREVIOUS day.
        it 'assigns midnight to the previous day and one second past midnight to the current day' do
          # Exactly midnight Jan 15 → belongs to Jan 14
          create(
            :fixed_measurement,
            stream: stream,
            value: 100,
            time: Time.parse('2025-01-15 00:00:00'),
            time_with_time_zone: Time.parse('2025-01-15 00:00:00 UTC'),
          )
          # One second past midnight Jan 15 → belongs to Jan 15
          create(
            :fixed_measurement,
            stream: stream,
            value: 20,
            time: Time.parse('2025-01-15 00:00:01'),
            time_with_time_zone: Time.parse('2025-01-15 00:00:01 UTC'),
          )
          # Exactly midnight Jan 16 → still belongs to Jan 15 (closed end)
          create(
            :fixed_measurement,
            stream: stream,
            value: 40,
            time: Time.parse('2025-01-16 00:00:00'),
            time_with_time_zone: Time.parse('2025-01-16 00:00:00 UTC'),
          )

          subject.call(stream_ids: [stream.id])

          jan_14 = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-14'))
          jan_15 = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-01-15'))

          expect(jan_14.value).to eq(100)  # only the midnight measurement
          expect(jan_15.value).to eq(30)   # (20 + 40) / 2 = 30
        end
      end
    end

    context 'fixed session is_indoor: false (time is local clock, time_with_time_zone is UTC-normalised)' do
      let(:stream) { create(:stream, :fixed, session: create(:fixed_session, is_indoor: false)) }

      it 'buckets by local time, not UTC time' do
        # 23:00 local Aug 28 → 04:00 UTC Aug 29 for UTC-5: must land on local Aug 28
        create(
          :fixed_measurement,
          stream: stream,
          value: 60,
          time: Time.parse('2025-08-28 23:00:00'),
          time_with_time_zone: Time.parse('2025-08-29 04:00:00 UTC'),
        )
        # 02:00 local Aug 28 → 07:00 UTC Aug 28: local Aug 28
        create(
          :fixed_measurement,
          stream: stream,
          value: 20,
          time: Time.parse('2025-08-28 02:00:00'),
          time_with_time_zone: Time.parse('2025-08-28 07:00:00 UTC'),
        )

        subject.call(stream_ids: [stream.id])

        aug_28 = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-08-28'))
        aug_29 = StreamDailyAverage.find_by(stream: stream, date: Date.parse('2025-08-29'))

        expect(aug_28.value).to eq(40)  # (60 + 20) / 2, both local Aug 28
        expect(aug_29).to be_nil        # would be non-nil if time_with_time_zone were used
      end

      it 'processes only the given stream_ids' do
        other_stream = create(:stream, :fixed, session: create(:fixed_session, is_indoor: false))

        create(
          :fixed_measurement,
          stream: stream,
          value: 10,
          time: Time.parse('2025-01-15 10:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 15:00:00 UTC'),
        )
        create(
          :fixed_measurement,
          stream: other_stream,
          value: 20,
          time: Time.parse('2025-01-15 11:00:00'),
          time_with_time_zone: Time.parse('2025-01-15 16:00:00 UTC'),
        )

        subject.call(stream_ids: [stream.id])

        expect(StreamDailyAverage.where(stream: stream).count).to eq(1)
        expect(StreamDailyAverage.where(stream: other_stream).count).to eq(0)
      end
    end
  end
end
