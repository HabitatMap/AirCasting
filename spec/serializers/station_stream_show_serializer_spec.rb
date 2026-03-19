require 'rails_helper'

RSpec.describe StationStreamShowSerializer do
  describe '#call' do
    let!(:config) do
      create(
        :stream_configuration,
        measurement_type: 'PM2.5',
        unit_symbol: 'µg/m³',
        threshold_very_low: 0,
        threshold_low: 9,
        threshold_medium: 35,
        threshold_high: 55,
        threshold_very_high: 150,
      )
    end
    let!(:station_stream) do
      create(
        :station_stream,
        stream_configuration: config,
        title: 'Test Station',
        location: 'SRID=4326;POINT(20.0 50.0)',
        first_measured_at: 2.days.ago,
        last_measured_at: 1.hour.ago,
      )
    end
    let!(:measurement_1) do
      create(:station_measurement, station_stream: station_stream, measured_at: 2.hours.ago, value: 12.5)
    end
    let!(:measurement_2) do
      create(:station_measurement, station_stream: station_stream, measured_at: 1.hour.ago, value: 15.0)
    end
    let!(:daily_average_1) do
      create(:station_stream_daily_average, station_stream: station_stream, date: Date.current.prev_day, value: 10)
    end
    let!(:daily_average_2) do
      create(:station_stream_daily_average, station_stream: station_stream, date: Date.current, value: 9)
    end

    it 'returns the correct serialized structure' do
      expected = {
        stream: {
          session_id: station_stream.id,
          active: true,
          title: station_stream.title,
          latitude: station_stream.location.y,
          longitude: station_stream.location.x,
          profile: station_stream.source.full_name,
          sensor_name: 'Government-PM2.5',
          unit_symbol: 'µg/m³',
          update_frequency: '1 hour',
          last_update: station_stream.last_measured_at,
          start_time: station_stream.first_measured_at,
          end_time: station_stream.last_measured_at,
          min: config.threshold_very_low,
          low: config.threshold_low,
          middle: config.threshold_medium,
          high: config.threshold_high,
          max: config.threshold_very_high,
        },
        measurements: [
          { time: measurement_1.measured_at.to_i * 1_000, value: measurement_1.value },
          { time: measurement_2.measured_at.to_i * 1_000, value: measurement_2.value },
        ],
        stream_daily_averages: [
          { date: daily_average_1.date.strftime('%Y-%m-%d'), value: daily_average_1.value },
          { date: daily_average_2.date.strftime('%Y-%m-%d'), value: daily_average_2.value },
        ],
      }

      result = described_class.new.call(
        station_stream: station_stream,
        measurements: [measurement_1, measurement_2],
        stream_daily_averages: [daily_average_1, daily_average_2],
      )

      expect(result).to eq(expected)
    end
  end
end
