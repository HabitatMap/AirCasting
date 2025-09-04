require 'rails_helper'

describe StreamDailyAverages::Repository do
  subject { described_class.new }

  describe '#daily_average_value' do
    it 'returns avarage value of measurements for given stream and day' do
      time_with_time_zone = Time.parse('2025-01-15 10:00 -05:00')
      stream = create(:stream, :fixed)

      measurement_1 =
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-15 09:00 -05:00'),
          value: 10,
        )
      measurement_2 =
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-15 10:00 -05:00'),
          value: 3,
        )

      measurement_3 =
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-01-16 00:00 -05:00'),
          value: 4,
        )

      create(
        :fixed_measurement,
        stream: stream,
        time_with_time_zone: Time.parse('2025-01-15 00:00 -05:00'),
        value: 50,
      )
      create(
        :fixed_measurement,
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
end
