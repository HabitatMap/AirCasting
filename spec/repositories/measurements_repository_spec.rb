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
end
