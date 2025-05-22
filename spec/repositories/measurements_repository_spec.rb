require 'rails_helper'

describe MeasurementsRepository do
  subject { described_class.new }

  describe '#last_2_days' do
    it 'returns last two days of measurements for given stream' do
      stream = create(:stream, :fixed)
      measurement_1 =
        create(
          :measurement,
          stream: stream,
          time: Time.parse('2025-01-15 09:00'),
        )
      measurement_2 =
        create(
          :measurement,
          stream: stream,
          time: Time.parse('2025-01-14 10:00'),
        )
      measurement_3 =
        create(
          :measurement,
          stream: stream,
          time: Time.parse('2025-01-13 09:00'),
        )
      create(
        :measurement,
        stream: stream,
        time: Time.parse('2025-01-13 08:00'),
        value: 50,
      )
      create(:measurement, time: Time.parse('2025-01-15 08:00'))

      result = subject.last_2_days(stream_id: stream.id)

      expect(result).to match_array(
        [measurement_1, measurement_2, measurement_3],
      )
    end
  end

  describe '#daily_average_value' do
    it 'returns avarage value of measurements for given stream and day' do
      time_with_time_zone = Time.parse('2025-01-15 10:00 -05:00')
      stream = create(:stream, :fixed)

      measurement_1 =
        create(
          :measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-15 09:00 -05:00'),
          value: 10,
        )
      measurement_2 =
        create(
          :measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-16 00:00 -05:00'),
          value: 3,
        )

      measurement_3 =
        create(
          :measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-16 00:00 -05:00'),
          value: 4,
        )

      create(
        :measurement,
        stream: stream,
        time_with_time_zone: Time.parse('2025-01-15 00:00 -05:00'),
        value: 50,
      )
      create(
        :measurement,
        time_with_time_zone: Time.parse('2025-01-15 09:00 -05:00'),
      )
      expected_value =
        (measurement_1.value + measurement_2.value + measurement_3.value) / 3

      result =
        subject.daily_average_value(
          stream_id: stream.id,
          time_with_time_zone: time_with_time_zone,
        )

      expect(result).to eq(expected_value)
    end
  end

  describe '#streams_averages_hourly_last_7_days' do
    let(:stubbed_time_current) { Time.parse('2024-11-22 12:30:00 +00:00') }

    before { allow(Time).to receive(:current).and_return(stubbed_time_current) }

    context 'when with_hour_shift is true' do
      it 'returns average values calculated for preceding hour' do
        stream_1 = create(:stream)
        stream_2 = create(:stream)

        create(
          :measurement,
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 2,
          time_with_time_zone: Time.parse('2024-11-22 12:30:00 +00:00'),
        )

        result =
          subject.streams_averages_hourly_last_7_days(
            stream_ids: [stream_1.id, stream_2.id],
            with_hour_shift: true,
          )

        expect(result).to match_array(
          [
            { time: Time.parse('2024-11-22 11:00:00 +00:00'), value: 10 },
            { time: Time.parse('2024-11-22 12:00:00 +00:00'), value: 8 },
          ],
        )
      end
    end

    context 'when with_hour_shift is false' do
      it 'returns average values calculated for succeeding hour' do
        stream_1 = create(:stream)
        stream_2 = create(:stream)

        create(
          :measurement,
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create(
          :measurement,
          stream: stream_2,
          value: 2,
          time_with_time_zone: Time.parse('2024-11-22 12:30:00 +00:00'),
        )

        result =
          subject.streams_averages_hourly_last_7_days(
            stream_ids: [stream_1.id, stream_2.id],
            with_hour_shift: false,
          )

        expect(result).to match_array(
          [
            { time: Time.parse('2024-11-22 10:00:00 +00:00'), value: 10 },
            { time: Time.parse('2024-11-22 11:00:00 +00:00'), value: 8 },
          ],
        )
      end
    end
  end
end
