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

    context 'when the bounding box crosses the date line (west > east)' do
      it 'returns streams on both sides of the 180° meridian' do
        ozone_config = create(:stream_configuration, measurement_type: 'Ozone', unit_symbol: 'ppb')

        # Station in eastern Russia (~170°E) — east of the date line
        stream_east = create(
          :station_stream,
          stream_configuration: ozone_config,
          location: 'SRID=4326;POINT(170.0 55.0)',
          first_measured_at: 2.hours.ago,
          last_measured_at: 1.hour.ago,
        )
        create(
          :station_measurement,
          station_stream: stream_east,
          measured_at: stream_east.last_measured_at,
          value: 30.0,
        )

        # Station in western Alaska (~-168°W) — west of the date line
        stream_west = create(
          :station_stream,
          stream_configuration: ozone_config,
          location: 'SRID=4326;POINT(-168.0 55.0)',
          first_measured_at: 2.hours.ago,
          last_measured_at: 1.hour.ago,
        )
        create(
          :station_measurement,
          station_stream: stream_west,
          measured_at: stream_west.last_measured_at,
          value: 40.0,
        )

        # Station in central Europe — should be excluded
        _stream_excluded = create(
          :station_stream,
          stream_configuration: ozone_config,
          location: 'SRID=4326;POINT(20.0 52.0)',
          first_measured_at: 2.hours.ago,
          last_measured_at: 1.hour.ago,
        )

        # Viewport straddling 180°: west=163° east=2° (west > east)
        result = subject.active_in_rectangle(
          sensor_name: 'government-ozone',
          west: 163.0,
          east: 2.0,
          north: 70.0,
          south: 40.0,
        )

        expect(result.map(&:id)).to contain_exactly(stream_east.id, stream_west.id)
      end
    end

    context 'time range filtering' do
      def create_stream_with_measurement(first_measured_at:, last_measured_at:)
        stream = create(
          :station_stream,
          stream_configuration: stream_configuration,
          location: 'SRID=4326;POINT(10.0 50.0)',
          first_measured_at: first_measured_at,
          last_measured_at: last_measured_at,
        )
        create(
          :station_measurement,
          station_stream: stream,
          measured_at: stream.last_measured_at,
        )
        stream
      end

      it 'returns streams that started and ended in the range' do
        stream = create_stream_with_measurement(
          first_measured_at: 20.hours.ago,
          last_measured_at: 10.hours.ago,
        )

        result = subject.active_in_rectangle(
          sensor_name: 'government-pm2.5',
          west: 5.0, east: 15.0, north: 55.0, south: 45.0,
          time_from: 22.hours.ago, time_to: 8.hours.ago,
        )

        expect(result.map(&:id)).to eq([stream.id])
      end

      it 'returns streams that started in the range and ended after' do
        stream = create_stream_with_measurement(
          first_measured_at: 20.hours.ago,
          last_measured_at: 10.hours.ago,
        )

        result = subject.active_in_rectangle(
          sensor_name: 'government-pm2.5',
          west: 5.0, east: 15.0, north: 55.0, south: 45.0,
          time_from: 22.hours.ago, time_to: 15.hours.ago,
        )

        expect(result.map(&:id)).to eq([stream.id])
      end

      it 'returns streams that started before the range and ended in the range' do
        stream = create_stream_with_measurement(
          first_measured_at: 20.hours.ago,
          last_measured_at: 10.hours.ago,
        )

        result = subject.active_in_rectangle(
          sensor_name: 'government-pm2.5',
          west: 5.0, east: 15.0, north: 55.0, south: 45.0,
          time_from: 12.hours.ago, time_to: 8.hours.ago,
        )

        expect(result.map(&:id)).to eq([stream.id])
      end

      it 'returns streams that started before and ended after the range' do
        stream = create_stream_with_measurement(
          first_measured_at: 20.hours.ago,
          last_measured_at: 2.hours.ago,
        )

        result = subject.active_in_rectangle(
          sensor_name: 'government-pm2.5',
          west: 5.0, east: 15.0, north: 55.0, south: 45.0,
          time_from: 12.hours.ago, time_to: 8.hours.ago,
        )

        expect(result.map(&:id)).to eq([stream.id])
      end

      it 'excludes streams that do not overlap with the range' do
        create_stream_with_measurement(
          first_measured_at: 20.hours.ago,
          last_measured_at: 10.hours.ago,
        )

        result = subject.active_in_rectangle(
          sensor_name: 'government-pm2.5',
          west: 5.0, east: 15.0, north: 55.0, south: 45.0,
          time_from: 8.hours.ago, time_to: 5.hours.ago,
        )

        expect(result).to be_empty
      end

      it 'returns all active streams when time params are not provided' do
        stream = create_stream_with_measurement(
          first_measured_at: 20.hours.ago,
          last_measured_at: 10.hours.ago,
        )

        result = subject.active_in_rectangle(
          sensor_name: 'government-pm2.5',
          west: 5.0, east: 15.0, north: 55.0, south: 45.0,
        )

        expect(result.map(&:id)).to eq([stream.id])
      end
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

  describe '#active_in_last_7_days_in_rectangle' do
    let(:stream_configuration) { create(:stream_configuration, measurement_type: 'PM2.5') }

    it 'returns station_streams within bounds active in last 7 days' do
      stream_inside = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.map(&:id)).to eq([stream_inside.id])
    end

    it 'excludes station_streams outside the bounding box' do
      create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(50.0 80.0)',
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result).to be_empty
    end

    it 'excludes station_streams inactive for more than 7 days' do
      create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 10.days.ago,
        last_measured_at: 8.days.ago,
      )

      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result).to be_empty
    end

    it 'filters by measurement type based on sensor name' do
      no2_config = create(:stream_configuration, measurement_type: 'NO2', unit_symbol: 'ppb')

      create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )
      no2_stream = create(
        :station_stream,
        stream_configuration: no2_config,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'government-no2',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result.map(&:id)).to eq([no2_stream.id])
    end

    it 'excludes non-canonical stream configurations' do
      non_canonical = create(
        :stream_configuration,
        measurement_type: 'PM2.5',
        unit_symbol: 'mg/m³',
        canonical: false,
      )
      create(
        :station_stream,
        stream_configuration: non_canonical,
        location: 'SRID=4326;POINT(10.0 50.0)',
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'government-pm2.5',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result).to be_empty
    end

    it 'returns empty relation for unrecognized sensor name' do
      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'unknown-sensor',
        west: 5.0,
        east: 15.0,
        north: 55.0,
        south: 45.0,
      )

      expect(result).to be_empty
    end

    it 'handles date-line crossing (west > east)' do
      ozone_config = create(:stream_configuration, measurement_type: 'Ozone', unit_symbol: 'ppb')

      stream_east = create(
        :station_stream,
        stream_configuration: ozone_config,
        location: 'SRID=4326;POINT(170.0 55.0)',
        last_measured_at: 1.hour.ago,
      )
      stream_west = create(
        :station_stream,
        stream_configuration: ozone_config,
        location: 'SRID=4326;POINT(-168.0 55.0)',
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_stream,
        stream_configuration: ozone_config,
        location: 'SRID=4326;POINT(20.0 52.0)',
        last_measured_at: 1.hour.ago,
      )

      result = subject.active_in_last_7_days_in_rectangle(
        sensor_name: 'government-ozone',
        west: 163.0,
        east: 2.0,
        north: 70.0,
        south: 40.0,
      )

      expect(result.map(&:id)).to contain_exactly(stream_east.id, stream_west.id)
    end
  end
end
