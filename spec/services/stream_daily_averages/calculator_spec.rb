require 'rails_helper'

describe StreamDailyAverages::Calculator do
  subject { described_class.new }

  describe '#call' do
    it 'calculates the daily averages' do
      session_1 = create(:fixed_session)
      session_2 = create(:fixed_session)
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)

      # stream_1, for: 2025-01-16, average: 2
      create(
        :fixed_measurement,
        stream: stream_1,
        value: 1,
        time: '2025-01-16 00:00:01',
      )
      create(
        :fixed_measurement,
        stream: stream_1,
        value: 2,
        time: '2025-01-16 00:10:00',
      )
      create(
        :fixed_measurement,
        stream: stream_1,
        value: 4,
        time: '2025-01-17 00:00:00',
      )

      # stream_1, for: 2025-01-17, average: 7
      create(
        :fixed_measurement,
        stream: stream_1,
        value: 8,
        time: '2025-01-17 00:00:01',
      )
      create(
        :fixed_measurement,
        stream: stream_1,
        value: 9,
        time: '2025-01-17 10:00:00',
      )
      create(
        :fixed_measurement,
        stream: stream_1,
        value: 3,
        time: '2025-01-18 00:00:00',
      )

      # stream_2, for: 2025-01-17, average: 5
      create(
        :fixed_measurement,
        stream: stream_2,
        value: 4,
        time: '2025-01-17 00:30:01',
      )
      create(
        :fixed_measurement,
        stream: stream_2,
        value: 11,
        time: '2025-01-17 10:00:01',
      )
      create(
        :fixed_measurement,
        stream: stream_2,
        value: 1,
        time: '2025-01-18 00:00:00',
      )

      expect { subject.call }.to change { StreamDailyAverage.count }.by(3)

      stream_daily_average_1_1 =
        StreamDailyAverage.find_by(
          stream_id: stream_1.id,
          date: Date.parse('2025-01-16'),
        )
      stream_daily_average_1_2 =
        StreamDailyAverage.find_by(
          stream_id: stream_1.id,
          date: Date.parse('2025-01-17'),
        )
      stream_daily_average_2_1 =
        StreamDailyAverage.find_by(
          stream_id: stream_2.id,
          date: Date.parse('2025-01-17'),
        )

      expect(stream_daily_average_1_1.value).to eq(2)
      expect(stream_daily_average_1_2.value).to eq(7)
      expect(stream_daily_average_2_1.value).to eq(5)
    end

    it 'updates values for existing records' do
      session = create(:fixed_session)
      stream = create(:stream, session: session)
      stream_daily_average =
        create(
          :stream_daily_average,
          stream: stream,
          date: Date.parse('2025-01-16'),
          value: 2,
        )
      create(
        :fixed_measurement,
        stream: stream,
        value: 1,
        time: '2025-01-16 00:09:00',
      )

      expect { subject.call }.to_not change { StreamDailyAverage.count }

      expect(stream_daily_average.reload.value).to eq(1)
    end
  end
end
