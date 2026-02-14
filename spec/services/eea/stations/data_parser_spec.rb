require 'rails_helper'

describe Eea::Stations::DataParser do
  let(:fixture_path) { file_fixture('eea_stations_sample.csv').to_s }
  let(:parser) { described_class.new }

  describe '#call' do
    it 'parses stations from CSV data' do
      stations = parser.call(file_path: fixture_path)

      expect(stations.count).to eq(7)
    end

    it 'extracts station attributes correctly' do
      stations = parser.call(file_path: fixture_path)
      station = stations.first

      expect(station.external_ref).to eq('SPO-AD0942A-6001')
      expect(station.measurement_type).to eq('PM2.5')
      expect(station.latitude).to eq(42.509690)
      expect(station.longitude).to eq(1.539140)
      expect(station.title).to eq('Escaldes-Engordany')
    end

    it 'normalizes O3 to Ozone' do
      stations = parser.call(file_path: fixture_path)
      ozone_station = stations.find { |s| s.measurement_type == 'Ozone' }

      expect(ozone_station).to be_present
    end

    it 'skips unsupported pollutants' do
      stations = parser.call(file_path: fixture_path)
      so2_station = stations.find { |s| s.measurement_type == 'SO2' }

      expect(so2_station).to be_nil
    end

    it 'skips rows with missing external_ref' do
      stations = parser.call(file_path: fixture_path)
      external_refs = stations.map(&:external_ref)

      expect(external_refs).not_to include('')
      expect(external_refs).not_to include(nil)
    end

    it 'uses Sampling Point Id as title when station name is missing' do
      stations = parser.call(file_path: fixture_path)
      station = stations.find { |s| s.external_ref == 'SPO-PL0004' }

      expect(station.title).to eq('SPO-PL0004')
    end

    it 'deduplicates stations by external_ref and measurement_type' do
      stations = parser.call(file_path: fixture_path)
      pm25_stations =
        stations.select do |s|
          s.external_ref == 'SPO-AD0942A-6001' && s.measurement_type == 'PM2.5'
        end

      expect(pm25_stations.count).to eq(1)
    end

    it 'returns stations without enriched fields' do
      stations = parser.call(file_path: fixture_path)
      station = stations.first

      expect(station.location).to be_nil
      expect(station.time_zone).to be_nil
      expect(station.source_id).to be_nil
      expect(station.stream_configuration_id).to be_nil
    end
  end
end
