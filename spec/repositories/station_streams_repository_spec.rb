require 'rails_helper'

RSpec.describe StationStreamsRepository do
  subject { described_class.new }

  describe '#active_in_rectangle' do
    let(:stream_configuration) { create(:stream_configuration, measurement_type: 'PM2.5') }

    it 'returns streams within geographic bounds' do
      stream_inside = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: stream_inside,
        measured_at: stream_inside.last_measured_at,
        value: 25.5,
      )
      _stream_outside = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(50.0 80.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.map(&:id)).to eq([stream_inside.id])
      expect(result.first.last_measurement_value).to eq(25.5)
    end

    it 'returns only streams active in last 24 hours' do
      active_stream = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: active_stream,
        measured_at: active_stream.last_measured_at,
      )
      inactive_stream = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 26.hours.ago,
        last_measured_at: 25.hours.ago,
      )
      create(
        :station_measurement,
        station_stream: inactive_stream,
        measured_at: inactive_stream.last_measured_at,
      )

      result = subject.active_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.map(&:id)).to eq([active_stream.id])
    end

    it 'filters by measurement type based on sensor name' do
      pm25_config = create(:stream_configuration, measurement_type: 'PM2.5')
      no2_config = create(:stream_configuration, measurement_type: 'NO2', unit_symbol: 'ppb')

      pm25_stream = create(
        :station_stream,
        stream_configuration: pm25_config,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: pm25_stream,
        measured_at: pm25_stream.last_measured_at,
      )
      no2_stream = create(
        :station_stream,
        stream_configuration: no2_config,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: no2_stream,
        measured_at: no2_stream.last_measured_at,
      )

      result = subject.active_in_rectangle(
        sensor_name: 'government-no2',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.map(&:id)).to eq([no2_stream.id])
    end

    it 'returns empty array for unknown sensor name' do
      result = subject.active_in_rectangle(
        sensor_name: 'unknown-sensor',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result).to eq([])
    end

    it 'only returns streams that have measurements' do
      stream_with_measurement = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: stream_with_measurement,
        measured_at: stream_with_measurement.last_measured_at,
      )
      _stream_without_measurement = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.map(&:id)).to eq([stream_with_measurement.id])
    end

    it 'eager loads stream_configuration' do
      stream = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: stream.last_measured_at,
      )

      result = subject.active_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.first.association(:stream_configuration).loaded?).to be(true)
    end
  end
end
