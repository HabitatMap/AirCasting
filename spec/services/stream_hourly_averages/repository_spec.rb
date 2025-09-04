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
