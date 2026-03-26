require 'rails_helper'

RSpec.describe Timelapse::GovernmentClustersCreator do
  subject { described_class.new }

  let(:source) { create(:source, name: 'EEA') }
  let(:stream_configuration) { create(:stream_configuration, measurement_type: 'PM2.5') }

  let(:base_params) do
    {
      sensor_name: 'government-pm2.5',
      west: 5.0,
      east: 25.0,
      north: 55.0,
      south: 45.0,
      zoom_level: 10,
    }
  end

  describe '#call' do
    it 'returns clustered timelapse data from station_streams and station_measurements' do
      station_stream = create(
        :station_stream,
        source: source,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )
      hour = 2.hours.ago.beginning_of_hour
      create(:station_measurement, station_stream: station_stream, measured_at: hour, value: 25.0)

      result = subject.call(params: base_params)

      expect(result.keys.length).to eq(1)
      entry = result.values.first.first
      expect(entry['value']).to eq(25.0)
      expect(entry['latitude']).to eq(50.0)
      expect(entry['longitude']).to eq(10.0)
      expect(entry['sessions']).to eq(1)
    end

    it 'clusters nearby station_streams and averages their measurements' do
      stream_a = create(
        :station_stream,
        source: source,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )
      stream_b = create(
        :station_stream,
        source: source,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0001 50.0001)',
        last_measured_at: 1.hour.ago,
      )
      hour = 2.hours.ago.beginning_of_hour
      create(:station_measurement, station_stream: stream_a, measured_at: hour, value: 10.0)
      create(:station_measurement, station_stream: stream_b, measured_at: hour, value: 20.0)

      result = subject.call(params: base_params)

      expect(result.keys.length).to eq(1)
      entry = result.values.first.first
      expect(entry['value']).to eq(15.0)
      expect(entry['sessions']).to eq(2)
    end

    it 'keeps far station_streams in separate clusters' do
      stream_a = create(
        :station_stream,
        source: source,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )
      stream_b = create(
        :station_stream,
        source: source,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(20.0 52.0)',
        last_measured_at: 1.hour.ago,
      )
      hour = 2.hours.ago.beginning_of_hour
      create(:station_measurement, station_stream: stream_a, measured_at: hour, value: 10.0)
      create(:station_measurement, station_stream: stream_b, measured_at: hour, value: 30.0)

      result = subject.call(params: base_params)

      expect(result.keys.length).to eq(1)
      entries = result.values.first
      expect(entries.length).to eq(2)
      values = entries.map { |e| e['value'] }
      expect(values).to contain_exactly(10.0, 30.0)
    end

    it 'returns empty hash when no station_streams match' do
      result = subject.call(params: base_params)

      expect(result).to eq({})
    end

    it 'returns response with string keys matching expected format' do
      station_stream = create(
        :station_stream,
        source: source,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: station_stream,
        measured_at: 2.hours.ago.beginning_of_hour,
        value: 10.0,
      )

      result = subject.call(params: base_params)

      result.each_key do |timestamp|
        expect(timestamp).to match(/\A\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0000\z/)
      end
    end
  end
end
