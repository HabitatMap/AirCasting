require 'rails_helper'

RSpec.describe StationStreamsSerializer do
  subject { described_class.new }

  describe '#call' do
    let(:stream_configuration) do
      create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³')
    end
    let(:first_measured_at) { 2.hours.ago }
    let(:last_measured_at) { 1.hour.ago }
    let(:station_stream) do
      create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(20.0 50.0)',
        title: 'Test Station',
        first_measured_at: first_measured_at,
        last_measured_at: last_measured_at,
      )
    end

    it 'serializes station streams to expected format' do
      create(
        :station_measurement,
        station_stream: station_stream,
        measured_at: last_measured_at,
        value: 25.7,
      )

      streams = StationStreamsRepository.new.active_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 15.0,
        east: 25.0,
        north: 55.0,
        south: 45.0,
      )

      result = subject.call(streams)

      expect(result['fetchableSessionsCount']).to eq(1)
      session = result['sessions'].first
      expect(session['id']).to eq(station_stream.id)
      expect(session['uuid']).to be_present
      expect(session['last_measurement_value']).to eq(26)
      expect(session['is_indoor']).to eq(false)
      expect(session['latitude']).to eq(50.0)
      expect(session['longitude']).to eq(20.0)
      expect(session['title']).to eq('Test Station')
      expect(session['username']).to eq('Government')
      expect(session['is_active']).to eq(true)
      expect(session['streams']).to eq(
        {
          'Government-PM2.5' => {
            'measurement_short_type' => 'PM2.5',
            'sensor_name' => 'Government-PM2.5',
            'unit_symbol' => 'µg/m³',
            'id' => station_stream.id,
          },
        },
      )
    end

    it 'returns fetchable sessions count' do
      create(
        :station_measurement,
        station_stream: station_stream,
        measured_at: last_measured_at,
      )

      streams = StationStreamsRepository.new.active_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 15.0,
        east: 25.0,
        north: 55.0,
        south: 45.0,
      )

      result = subject.call(streams)

      expect(result['fetchableSessionsCount']).to eq(1)
    end

    it 'handles empty streams' do
      streams = []

      result = subject.call(streams)

      expect(result).to eq({ 'fetchableSessionsCount' => 0, 'sessions' => [] })
    end
  end
end
