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

        # New York (UTC-5): one within lookback, one before local midnight Jan 14
        # (lookback = 2 days; since = Jan 14 00:00 EST = Jan 14 05:00 UTC)
        create(
          :station_measurement,
          station_stream: ny_stream,
          measured_at: Time.parse('2026-01-15 14:00:00 -0500'),
          value: 10,
        )
        create(
          :station_measurement,
          station_stream: ny_stream,
          measured_at: Time.parse('2026-01-13 14:00:00 -0500'),
          value: 100,
        )

        # Warsaw (UTC+1): one within lookback, one before local midnight Jan 14
        # (lookback = 2 days; since = Jan 14 00:00 CET = Jan 13 23:00 UTC)
        create(
          :station_measurement,
          station_stream: warsaw_stream,
          measured_at: Time.parse('2026-01-15 14:00:00 +0100'),
          value: 20,
        )
        create(
          :station_measurement,
          station_stream: warsaw_stream,
          measured_at: Time.parse('2026-01-13 14:00:00 +0100'),
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

    it 'correctly attributes the local midnight measurement to the previous day' do
      # Regression test: with >= in the WHERE clause, the midnight measurement at
      # exactly the `since` boundary was included but CASE assigned it to the
      # previous day, overwriting that day's average with a single measurement.
      # The fix (> instead of >=, lookback_days = 2) must:
      #   1. Include midnight measurements that fell after the since boundary
      #   2. Correctly attribute them to the day they belong to (previous day)
      #   3. NOT overwrite days older than the lookback window
      travel_to Time.parse('2026-01-16 06:30:00 UTC') do
        stream = create(:station_stream, time_zone: 'America/New_York')

        # 23 hourly measurements on Jan 14 EST (01:00–23:00)
        23.times do |i|
          create(
            :station_measurement,
            station_stream: stream,
            measured_at: Time.parse("2026-01-14 #{format('%02d', i + 1)}:00:00 -0500"),
            value: 10,
          )
        end

        # Midnight measurement: 00:00:00 Jan 15 EST = end of Jan 14
        # Should be assigned to Jan 14 by the CASE logic
        create(
          :station_measurement,
          station_stream: stream,
          measured_at: Time.parse('2026-01-15 00:00:00 -0500'),
          value: 106,
        )

        # Midnight measurement: 00:00:00 Jan 14 EST = sits exactly at the `since`
        # boundary (Jan 14 05:00 UTC). With >=, CASE would assign it to Jan 13,
        # corrupting that day. With >, it must be excluded entirely.
        create(
          :station_measurement,
          station_stream: stream,
          measured_at: Time.parse('2026-01-14 00:00:00 -0500'),
          value: 999,
        )

        subject.call

        jan14 = StationStreamDailyAverage.find_by(station_stream: stream, date: Date.parse('2026-01-14'))
        # Average = (23 * 10 + 106) / 24 = 336 / 24 = 14.0 (boundary midnight excluded)
        expect(jan14).not_to be_nil
        expect(jan14.value).to eq(14)

        # Jan 13 must have no record — the Jan 14 midnight was excluded by >
        jan13 = StationStreamDailyAverage.find_by(station_stream: stream, date: Date.parse('2026-01-13'))
        expect(jan13).to be_nil
      end
    end

    it 'does not overwrite a previously correct daily average on subsequent runs' do
      stream = create(:station_stream, time_zone: 'America/New_York')

      # 23 hourly measurements on Jan 14 EST (01:00–23:00)
      23.times do |i|
        create(
          :station_measurement,
          station_stream: stream,
          measured_at: Time.parse("2026-01-14 #{format('%02d', i + 1)}:00:00 -0500"),
          value: 10,
        )
      end

      # Midnight measurement: 00:00:00 Jan 15 EST = belongs to Jan 14
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 00:00:00 -0500'),
        value: 106,
      )

      # First run on Jan 15 — Jan 14 should be correctly computed
      travel_to Time.parse('2026-01-15 06:30:00 UTC') do
        subject.call
      end

      jan14 = StationStreamDailyAverage.find_by(station_stream: stream, date: Date.parse('2026-01-14'))
      expect(jan14).not_to be_nil
      expect(jan14.value).to eq(14)

      # Second run on Jan 16 — Jan 14 must NOT be overwritten
      travel_to Time.parse('2026-01-16 06:30:00 UTC') do
        stream.touch
        subject.call
      end

      expect(jan14.reload.value).to eq(14)
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
