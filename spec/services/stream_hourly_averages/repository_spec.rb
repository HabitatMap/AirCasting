require 'rails_helper'

RSpec.describe StreamHourlyAverages::Repository do
  subject { described_class.new }

  describe '#insert_stream_hourly_averages' do
    it 'creates stream_hourly_average records based on calculated measurements average values' do
      #TODO: remove once stream_configuration is in place
      create(:user, username: 'US EPA AirNow')
      start_date_time = Time.parse('2024-12-10 11:00:00 +00:00')
      end_date_time = Time.parse('2024-12-10 12:00:00 +00:00')

      stream_1 = create(:stream, :fixed)
      stream_1_measurement_1 =
        create(
          :fixed_measurement,
          stream: stream_1,
          time_with_time_zone: Time.parse('2024-12-10 11:30:00 +00:00'),
          value: 2,
        )
      stream_1_measurement_2 =
        create(
          :fixed_measurement,
          stream: stream_1,
          time_with_time_zone: Time.parse('2024-12-10 12:00:00 +00:00'),
          value: 4,
        )
      stream_2 = create(:stream, :fixed)
      stream_2_measurement_1 =
        create(
          :fixed_measurement,
          stream: stream_2,
          time_with_time_zone: Time.parse('2024-12-10 11:30:00 +00:00'),
          value: 6,
        )

      _stream_2_measurement_old =
        create(
          :fixed_measurement,
          stream: stream_2,
          time_with_time_zone: Time.parse('2024-12-09 12:00:00 +00:00'),
          value: 6,
        )

      subject.insert_stream_hourly_averages(
        start_date_time: start_date_time,
        end_date_time: end_date_time,
      )

      attributes = StreamHourlyAverage.pluck(:stream_id, :value, :date_time)
      expect(attributes).to match_array(
        [
          [stream_1.id, 3, Time.parse('2024-12-10 12:00:00 +00:00')],
          [stream_2.id, 6, Time.parse('2024-12-10 12:00:00 +00:00')],
        ],
      )
    end
  end

  describe '#upsert_hourly_averages_for_stream' do
    it 'creates hourly averages grouped by bucket for all measurements in range' do
      stream = create(:stream, :fixed)
      create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 13:30:00 UTC'), value: 10)
      create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 14:30:00 UTC'), value: 30)

      subject.upsert_hourly_averages_for_stream(
        stream_id: stream.id,
        start_date_time: Time.parse('2025-06-17 13:00:00 UTC'),
        end_date_time: Time.parse('2025-06-17 15:00:00 UTC'),
      )

      averages = StreamHourlyAverage.pluck(:stream_id, :date_time, :value)
      expect(averages).to match_array([
        [stream.id, Time.parse('2025-06-17 14:00:00 UTC'), 10],
        [stream.id, Time.parse('2025-06-17 15:00:00 UTC'), 30],
      ])
    end

    it 'treats a measurement at exactly HH:00:00 as the end of the previous bucket' do
      stream = create(:stream, :fixed)
      create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 15:00:00 UTC'), value: 40)

      subject.upsert_hourly_averages_for_stream(
        stream_id: stream.id,
        start_date_time: Time.parse('2025-06-17 14:00:00 UTC'),
        end_date_time: Time.parse('2025-06-17 15:00:00 UTC'),
      )

      expect(StreamHourlyAverage.first).to have_attributes(
        date_time: Time.parse('2025-06-17 15:00:00 UTC'),
        value: 40,
      )
    end

    it 'overwrites an existing average on conflict' do
      stream = create(:stream, :fixed)
      existing = create(:stream_hourly_average, stream: stream, date_time: Time.parse('2025-06-17 15:00:00 UTC'), value: 999)
      create(:fixed_measurement, stream: stream, time_with_time_zone: Time.parse('2025-06-17 14:30:00 UTC'), value: 50)

      subject.upsert_hourly_averages_for_stream(
        stream_id: stream.id,
        start_date_time: Time.parse('2025-06-17 14:00:00 UTC'),
        end_date_time: Time.parse('2025-06-17 15:00:00 UTC'),
      )

      expect(existing.reload.value).to eq(50)
    end

    it 'does nothing when there are no measurements in the range' do
      stream = create(:stream, :fixed)

      expect {
        subject.upsert_hourly_averages_for_stream(
          stream_id: stream.id,
          start_date_time: Time.parse('2025-06-17 14:00:00 UTC'),
          end_date_time: Time.parse('2025-06-17 15:00:00 UTC'),
        )
      }.not_to change(StreamHourlyAverage, :count)
    end
  end

  describe '#update_streams_last_hourly_average_ids' do
    it 'updates the last_hourly_average_ids for the streams' do
      date_time = Time.parse('2024-12-10 12:00:00 +00:00')

      stream_1 = create(:stream, :fixed)
      stream_2 = create(:stream, :fixed)

      stream_1_hourly_average =
        create(:stream_hourly_average, stream: stream_1, date_time: date_time)
      stream_2_hourly_average =
        create(:stream_hourly_average, stream: stream_2, date_time: date_time)
      _other_stream_hourly_average =
        create(
          :stream_hourly_average,
          stream: stream_2,
          date_time: (date_time - 3.hours),
        )

      subject.update_streams_last_hourly_average_ids(date_time: date_time)

      expect(stream_1.reload.last_hourly_average_id).to eq(
        stream_1_hourly_average.id,
      )
      expect(stream_2.reload.last_hourly_average_id).to eq(
        stream_2_hourly_average.id,
      )
    end
  end
end
