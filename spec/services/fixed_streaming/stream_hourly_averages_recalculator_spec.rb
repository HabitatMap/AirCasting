require 'rails_helper'

RSpec.describe FixedStreaming::StreamHourlyAveragesRecalculator do
  subject { described_class.new }

  describe '#call' do
    it 'creates a hourly average for measurements in a single hour bucket' do
      stream = create(:stream, :fixed)
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 14:10:00 UTC'),
          value: 10,
        ),
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 14:40:00 UTC'),
          value: 20,
        ),
      ]

      subject.call(measurements: measurements, stream_id: stream.id)

      expect(StreamHourlyAverage.count).to eq(1)
      expect(StreamHourlyAverage.first).to have_attributes(
        stream_id: stream.id,
        date_time: Time.parse('2025-06-17 15:00:00 UTC'),
        value: 15,
      )
    end

    it 'creates separate hourly averages for measurements spanning multiple hour buckets' do
      stream = create(:stream, :fixed)
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 13:30:00 UTC'),
          value: 10,
        ),
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 14:30:00 UTC'),
          value: 30,
        ),
      ]

      subject.call(measurements: measurements, stream_id: stream.id)

      expect(StreamHourlyAverage.count).to eq(2)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 14:00:00 UTC'))).to have_attributes(
        stream_id: stream.id,
        value: 10,
      )
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 15:00:00 UTC'))).to have_attributes(
        stream_id: stream.id,
        value: 30,
      )
    end

    it 'treats a measurement at exactly HH:00:00 as the end of the previous bucket' do
      stream = create(:stream, :fixed)
      # 15:00:00 exactly closes the (14:00, 15:00] bucket, stored as date_time = 15:00
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 15:00:00 UTC'),
          value: 40,
        ),
      ]

      subject.call(measurements: measurements, stream_id: stream.id)

      expect(StreamHourlyAverage.count).to eq(1)
      expect(StreamHourlyAverage.first).to have_attributes(
        date_time: Time.parse('2025-06-17 15:00:00 UTC'),
        value: 40,
      )
    end

    it 'updates an existing hourly average instead of skipping on conflict' do
      stream = create(:stream, :fixed)
      existing =
        create(
          :stream_hourly_average,
          stream: stream,
          date_time: Time.parse('2025-06-17 15:00:00 UTC'),
          value: 999,
        )
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 14:30:00 UTC'),
          value: 50,
        ),
      ]

      subject.call(measurements: measurements, stream_id: stream.id)

      expect(StreamHourlyAverage.count).to eq(1)
      expect(existing.reload.value).to eq(50)
    end

    it 'creates correct hourly averages when measurements span a large time window (e.g. 6 hours offline)' do
      stream = create(:stream, :fixed)
      # Simulate a device that was offline and synced a whole night worth of data:
      # measurements spread across 6 distinct hour buckets
      measurements = [
        create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 01:15:00 UTC'), value: 10),
        create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 02:45:00 UTC'), value: 20),
        create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 03:30:00 UTC'), value: 30),
        create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 04:50:00 UTC'), value: 40),
        create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 05:20:00 UTC'), value: 50),
        create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 06:10:00 UTC'), value: 60),
      ]

      subject.call(measurements: measurements, stream_id: stream.id)

      expect(StreamHourlyAverage.count).to eq(6)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 02:00:00 UTC')).value).to eq(10)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 03:00:00 UTC')).value).to eq(20)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 04:00:00 UTC')).value).to eq(30)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 05:00:00 UTC')).value).to eq(40)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 06:00:00 UTC')).value).to eq(50)
      expect(StreamHourlyAverage.find_by(date_time: Time.parse('2025-06-17 07:00:00 UTC')).value).to eq(60)
    end

    it 'uses all measurements in the bucket (not just the synced ones) when computing the average' do
      stream = create(:stream, :fixed)
      # Pre-existing measurement in the same bucket, not part of the sync
      create(
        :fixed_measurement,
        stream: stream,
        time_with_time_zone: Time.parse('2025-06-17 14:00:01 UTC'),
        value: 10,
      )
      measurements = [
        create(
          :fixed_measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2025-06-17 14:30:00 UTC'),
          value: 30,
        ),
      ]

      subject.call(measurements: measurements, stream_id: stream.id)

      expect(StreamHourlyAverage.first.value).to eq(20) # (10 + 30) / 2
    end
  end
end
