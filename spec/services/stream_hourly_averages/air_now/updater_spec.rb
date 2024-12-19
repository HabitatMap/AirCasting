require 'rails_helper'

RSpec.describe StreamHourlyAverages::AirNow::Updater do
  subject { described_class.new }

  describe '#call' do
    it 'creates stream_hourly_average records and updates stream references to last_hourly_average' do
      stream = create(:stream, :fixed, last_hourly_average: nil)
      old_stream_hourly_average =
        create(
          :stream_hourly_average,
          stream: stream,
          date_time: Time.parse('2024-12-19 10:00:00'),
        )
      stream.update!(last_hourly_average: old_stream_hourly_average)

      measurement =
        create(
          :measurement,
          stream: stream,
          time_with_time_zone: Time.parse('2024-12-19 11:00:00'),
          value: 2,
        )

      subject.call(measurement_ids: [measurement.id])

      stream_hourly_average = StreamHourlyAverage.last

      expect(stream_hourly_average).to have_attributes(
        stream_id: stream.id,
        value: measurement.value,
        date_time: measurement.time_with_time_zone,
      )
      expect(stream.reload.last_hourly_average_id).to eq(
        stream_hourly_average.id,
      )
    end

    it 'creates stream_hourly_average records based on multiple measurements' do
      measurements = create_list(:measurement, 5)

      expect {
        subject.call(measurement_ids: measurements.map(&:id))
      }.to change(StreamHourlyAverage, :count).by(measurements.size)
    end

    context 'when latest stream hourly average for a stream is already saved' do
      it 'creates stream_hourly_average records, but does not update stream references to last_hourly_average' do
        stream = create(:stream, :fixed, last_hourly_average: nil)
        latest_stream_hourly_average =
          create(
            :stream_hourly_average,
            stream: stream,
            date_time: Time.parse('2024-12-19 11:00:00'),
          )
        stream.update!(last_hourly_average: latest_stream_hourly_average)

        measurement =
          create(
            :measurement,
            stream: stream,
            time_with_time_zone: Time.parse('2024-12-19 10:00:00'),
          )

        expect { subject.call(measurement_ids: [measurement.id]) }.to change(
          StreamHourlyAverage,
          :count,
        ).by(1)

        expect(stream.reload.last_hourly_average_id).to eq(
          latest_stream_hourly_average.id,
        )
      end
    end
  end
end
