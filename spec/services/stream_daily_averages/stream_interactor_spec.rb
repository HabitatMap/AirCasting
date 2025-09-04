require 'rails_helper'

describe StreamDailyAverages::StreamInteractor do
  subject { described_class.new }

  describe '#call' do
    context 'when record for given day and stream does not exist' do
      it 'creates stream daily average' do
        station_current_time = Time.parse('2025-01-15 10:00 -05:00')
        stream = create(:stream, :fixed)
        create(
          :fixed_measurement,
          stream: stream,
          value: 10,
          time_with_time_zone: Time.parse('2025-01-15 06:00 -05:00'),
        )
        create(
          :fixed_measurement,
          stream: stream,
          value: 11,
          time_with_time_zone: Time.parse('2025-01-15 08:00 -05:00'),
        )

        expect {
          subject.call(
            stream_id: stream.id,
            station_current_time: station_current_time,
            is_air_now_stream: false,
          )
        }.to change(StreamDailyAverage, :count).by(1)

        stream_daily_value = StreamDailyAverage.first
        expect(stream_daily_value).to have_attributes(
          stream_id: stream.id,
          value: 11,
          date: Date.parse('2025-01-15'),
        )
      end
    end

    context 'when record for given day and stream exists' do
      it 'updates stream daily average value' do
        station_current_time = Time.parse('2025-01-15 10:00 -05:00')
        stream = create(:stream, :fixed)
        stream_daily_average =
          create(
            :stream_daily_average,
            stream: stream,
            value: 2,
            date: Date.parse('2025-01-15'),
          )
        create(
          :fixed_measurement,
          stream: stream,
          value: 10,
          time_with_time_zone: Time.parse('2025-01-15 06:00 -05:00'),
        )
        create(
          :fixed_measurement,
          stream: stream,
          value: 9,
          time_with_time_zone: Time.parse('2025-01-15 08:00 -05:00'),
        )

        expect {
          subject.call(
            stream_id: stream.id,
            station_current_time: station_current_time,
            is_air_now_stream: false,
          )
        }.not_to change(StreamDailyAverage, :count)

        expect(stream_daily_average.reload.value).to eq(10)
      end
    end

    context 'when it is the first hour of the day' do
      it 'recalculates daily values for previous day' do
        station_current_time = Time.parse('2025-01-15 00:30 -05:00')
        stream = create(:stream, :fixed)
        stream_daily_average =
          create(
            :stream_daily_average,
            stream: stream,
            value: 2,
            date: Date.parse('2025-01-14'),
          )
        m_1 =
          create(
            :fixed_measurement,
            stream: stream,
            value: 1,
            time_with_time_zone: Time.parse('2025-01-14 10:00 -05:00'),
          )

        subject.call(
          stream_id: stream.id,
          station_current_time: station_current_time,
          is_air_now_stream: false,
        )

        expect(stream_daily_average.reload.value).to eq(1)
      end
    end

    context 'when handling AirNow stream in the first hour of the day' do
      it 'recalculates daily values for two previous days' do
        station_current_time = Time.parse('2025-01-15 00:30 -05:00')
        stream = create(:stream, :fixed)
        stream_daily_average_01_14 =
          create(
            :stream_daily_average,
            stream: stream,
            value: 2,
            date: Date.parse('2025-01-14'),
          )
        stream_daily_average_01_13 =
          create(
            :stream_daily_average,
            stream: stream,
            value: 2,
            date: Date.parse('2025-01-13'),
          )

        create(
          :fixed_measurement,
          stream: stream,
          value: 7,
          time_with_time_zone: Time.parse('2025-01-14 10:00 -05:00'),
        )

        create(
          :fixed_measurement,
          stream: stream,
          value: 8,
          time_with_time_zone: Time.parse('2025-01-13 10:00 -05:00'),
        )

        subject.call(
          stream_id: stream.id,
          station_current_time: station_current_time,
          is_air_now_stream: true,
        )

        expect(stream_daily_average_01_14.reload.value).to eq(7)
        expect(stream_daily_average_01_13.reload.value).to eq(8)
      end
    end
  end
end
