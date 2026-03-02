require 'rails_helper'

describe GovernmentSources::StationStreamDailyAveragesCalculator do
  subject { described_class.new }

  describe '#call' do
    it 'creates a daily average per stream, one per time zone, excluding measurements outside the lookback' do
      travel_to Time.parse('2026-01-16 10:00:00 UTC') do
        stream_configuration = create(:stream_configuration)
        ny_stream =
          create(
            :station_stream,
            time_zone: 'America/New_York',
            stream_configuration: stream_configuration,
          )
        warsaw_stream =
          create(
            :station_stream,
            time_zone: 'Europe/Warsaw',
            stream_configuration: stream_configuration,
          )

        # New York (UTC-5): one within lookback, one before local midnight Jan 15
        create(
          :station_measurement,
          station_stream: ny_stream,
          measured_at: Time.parse('2026-01-15 14:00:00 -0500'),
          value: 10,
        )
        create(
          :station_measurement,
          station_stream: ny_stream,
          measured_at: Time.parse('2026-01-14 14:00:00 -0500'),
          value: 100,
        )

        # Warsaw (UTC+1): one within lookback, one before local midnight Jan 15
        create(
          :station_measurement,
          station_stream: warsaw_stream,
          measured_at: Time.parse('2026-01-15 14:00:00 +0100'),
          value: 20,
        )
        create(
          :station_measurement,
          station_stream: warsaw_stream,
          measured_at: Time.parse('2026-01-14 14:00:00 +0100'),
          value: 100,
        )

        subject.call

        expect(StationStreamDailyAverage.count).to eq(2)
        expect(
          StationStreamDailyAverage.find_by(station_stream: ny_stream).date,
        ).to eq(Date.parse('2026-01-15'))
        expect(
          StationStreamDailyAverage.find_by(station_stream: ny_stream).value,
        ).to eq(10.0)
        expect(
          StationStreamDailyAverage.find_by(station_stream: warsaw_stream).date,
        ).to eq(Date.parse('2026-01-15'))
        expect(
          StationStreamDailyAverage.find_by(station_stream: warsaw_stream)
            .value,
        ).to eq(20.0)
      end
    end

    it 'skips streams not updated within the last hour' do
      stream = create(:station_stream, time_zone: 'UTC')
      stream.update_column(:updated_at, 2.hours.ago)
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: 1.day.ago.in_time_zone('UTC').beginning_of_day + 12.hours,
        value: 10,
      )

      subject.call

      expect(StationStreamDailyAverage.count).to eq(0)
    end
  end
end
