require 'rails_helper'

describe Epa::Stations::DataParser do
  let(:sample_data) { file_fixture('epa_locations_v2_sample.dat').read }
  let(:parser) { described_class.new }

  describe '#call' do
    it 'parses streams from the V2 file, skipping the header' do
      stations = parser.call(data: sample_data)

      expect(stations.count).to eq(6)
      expect(stations.map(&:external_ref)).not_to include('StationID')
    end

    it 'extracts stream and station attributes correctly' do
      stations = parser.call(data: sample_data)
      station = stations.first

      expect(station.external_ref).to eq('060010007')
      expect(station.station_external_ref).to eq('840060010007')
      expect(station.measurement_type).to eq('PM2.5')
      expect(station.latitude).to eq(37.687526)
      expect(station.longitude).to eq(-121.784217)
      expect(station.title).to eq('Livermore')
      expect(station.excluded_reason).to be_nil
    end

    it 'normalizes O3 to Ozone' do
      stations = parser.call(data: sample_data)
      ozone_station = stations.find { |s| s.measurement_type == 'Ozone' }

      expect(ozone_station).to be_present
    end

    it 'skips unsupported parameters' do
      stations = parser.call(data: sample_data)
      co_station = stations.find { |s| s.measurement_type == 'CO' }

      expect(co_station).to be_nil
    end

    it 'skips rows with a missing StationID or FullAQSID' do
      stations = parser.call(data: sample_data)

      expect(stations.map(&:external_ref)).not_to include('', nil, '060010012')
    end

    it 'skips rows without a real position' do
      stations = parser.call(data: sample_data)

      expect(stations.map(&:external_ref)).not_to include(
        '070000000000',
        '080000000000',
      )
    end

    it 'marks temporary monitors as excluded' do
      stations = parser.call(data: sample_data)
      station = stations.find { |s| s.external_ref == 'TT1234567890' }

      expect(station.excluded_reason).to eq(
        Station::EXCLUDED_REASONS[:temporary],
      )
    end

    it 'uses StationID as title when the site name is missing' do
      stations = parser.call(data: sample_data)
      station = stations.find { |s| s.external_ref == '060010011' }

      expect(station.title).to eq('060010011')
    end

    it 'deduplicates stations by external_ref and measurement_type' do
      stations = parser.call(data: sample_data)
      pm25_stations = stations.select { |s| s.external_ref == '060010007' && s.measurement_type == 'PM2.5' }

      expect(pm25_stations.count).to eq(1)
    end

    it 'returns stations without enriched fields' do
      stations = parser.call(data: sample_data)
      station = stations.first

      expect(station.location).to be_nil
      expect(station.time_zone).to be_nil
      expect(station.source_id).to be_nil
      expect(station.stream_configuration_id).to be_nil
      expect(station.station_id).to be_nil
    end
  end
end
