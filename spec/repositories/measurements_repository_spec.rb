require 'rails_helper'

describe MeasurementsRepository do
  subject { described_class.new }

  describe '#from_last_24_hours' do
    it 'returns measurements for given stream' do
      stream = create_stream!
      measurements = create_measurements!({ stream: stream, count: 10 })
      other_measurement = create_measurement!

      result = subject.from_last_24_hours(stream_id: stream.id)

      expect(result).to match_array(measurements)
    end

    it 'returns last 1440 measurements' do
      stream = create_stream!
      create_measurements!({ stream: stream, count: 1441 })

      result = subject.from_last_24_hours(stream_id: stream.id)

      expect(result.size).to eq(1440)
    end
  end

  describe '#stream_daily_average_value' do
    it 'returns avarage value of measurements for given stream and day' do
      stream = create_stream!
      time_with_time_zone = Time.current.prev_day
      beginning_of_day = time_with_time_zone.beginning_of_day
      measurement_1 =
        create_measurement!(
          { stream: stream, time_with_time_zone: beginning_of_day, value: 10 },
        )
      measurement_2 =
        create_measurement!(
          {
            stream: stream,
            time_with_time_zone: beginning_of_day + 1.hour,
            value: 6,
          },
        )
      create_measurement!(
        {
          stream: stream,
          time_with_time_zone: beginning_of_day - 1.hour,
          value: 50,
        },
      )
      create_measurement!(time_with_time_zone: beginning_of_day)
      expected_value = (measurement_1.value + measurement_2.value) / 2

      result =
        subject.stream_daily_average_value(
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
        stream_1 = create_stream!
        stream_2 = create_stream!

        create_measurement!(
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create_measurement!(
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create_measurement!(
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create_measurement!(
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
        stream_1 = create_stream!
        stream_2 = create_stream!

        create_measurement!(
          stream: stream_1,
          value: 10,
          time_with_time_zone: Time.parse('2024-11-22 10:30:00 +00:00'),
        )
        create_measurement!(
          stream: stream_1,
          value: 12,
          time_with_time_zone: Time.parse('2024-11-22 11:00:00 +00:00'),
        )
        create_measurement!(
          stream: stream_2,
          value: 4,
          time_with_time_zone: Time.parse('2024-11-22 11:30:00 +00:00'),
        )
        create_measurement!(
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
