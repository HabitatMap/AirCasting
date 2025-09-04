require 'rails_helper'

RSpec.describe FixedStreaming::StreamDailyAveragesRecalculator do
  subject { described_class.new }

  describe '#call' do
    it 'recalculates daily averages for the correct dates' do
      stream = create(:stream)
      stream_daily_average_17_06 =
        create(
          :stream_daily_average,
          stream: stream,
          date: Date.parse('2025-06-17'),
          value: 1,
        )
      stream_daily_average_18_06 =
        create(
          :stream_daily_average,
          stream: stream,
          date: Date.parse('2025-06-18'),
          value: 1,
        )

      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 01:00:00 -04:00'),
          value: 10,
        ),
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 10:30:00 -04:00'),
          value: 20,
        ),
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-18 02:00:00 -04:00'),
          value: 30,
        ),
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-18 12:45:00 -04:00'),
          value: 40,
        ),
      ]

      subject.call(
        measurements: measurements,
        time_zone: 'America/New_York',
        stream_id: stream.id,
      )

      expect(stream_daily_average_17_06.reload.value).to eq(15.0)
      expect(stream_daily_average_18_06.reload.value).to eq(35.0)
    end

    it 'creates new stream daily averages records for dates without existing averages' do
      stream = create(:stream)
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 01:00:00 -04:00'),
          value: 10,
        ),
      ]

      subject.call(
        measurements: measurements,
        time_zone: 'America/New_York',
        stream_id: stream.id,
      )

      stream_daily_average = StreamDailyAverage.first
      expect(stream_daily_average).to have_attributes(
        stream: stream,
        date: Date.parse('2025-06-17'),
        value: 10.0,
      )
    end

    it 'treats 00:00:00 as the end of the previous day' do
      stream = create(:stream)
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 00:00:00 -04:00'),
          value: 10,
        ),
      ]

      subject.call(
        measurements: measurements,
        time_zone: 'America/New_York',
        stream_id: stream.id,
      )

      stream_daily_average = StreamDailyAverage.first
      expect(stream_daily_average).to have_attributes(
        stream: stream,
        date: Date.parse('2025-06-16'),
        value: 10,
      )
    end
  end
end
