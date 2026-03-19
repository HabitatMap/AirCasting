require 'rails_helper'

describe 'GET /api/v3/station_streams/:id' do
  let!(:config) do
    create( :stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³')
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

  context 'when station stream exists' do
    let!(:measurement_1) do
      create( :station_measurement, station_stream: station_stream, measured_at: 2.hours.ago, value: 12.5)
    end
    let!(:measurement_2) do
      create( :station_measurement, station_stream: station_stream, measured_at: 1.hour.ago, value: 15.0)
    end
    let!(:daily_average_1) do
      create( :station_stream_daily_average, station_stream: station_stream, date: Date.current.prev_day, value: 10)
    end
    let!(:daily_average_2) do
      create( :station_stream_daily_average, station_stream: station_stream, date: Date.current, value: 9)
    end

    before { get "/api/v3/station_streams/#{station_stream.id}" }

    it_behaves_like 'stream show response'

    it 'returns the correct station stream data' do
      expected_response = {
        stream: {
          session_id: station_stream.id,
          active: true,
          title: station_stream.title,
          latitude: station_stream.location.y,
          longitude: station_stream.location.x,
          profile: station_stream.source.full_name,
          sensor_name: 'Government-PM2.5',
          unit_symbol: config.unit_symbol,
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

      expect(JSON.parse(response.body)).to eq(expected_response.as_json)
    end
  end

  context 'when station stream does not exist' do
    before { get '/api/v3/station_streams/0' }

    it 'returns HTTP 404' do
      expect(response.status).to eq(404)
    end
  end
end
