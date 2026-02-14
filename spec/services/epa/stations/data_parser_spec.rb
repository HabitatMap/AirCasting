require 'rails_helper'

describe Epa::Stations::DataParser do
  let(:sample_data) { file_fixture('epa_locations_sample.dat').read }
  let(:parser) { described_class.new }

  describe '#call' do
    it 'parses stations from pipe-delimited data' do
      stations = parser.call(data: sample_data)

      expect(stations.count).to eq(5)
    end

    it 'extracts station attributes correctly' do
      stations = parser.call(data: sample_data)
      station = stations.first

      expect(station.external_ref).to eq('060010007')
      expect(station.measurement_type).to eq('PM2.5')
      expect(station.latitude).to eq(37.687526)
      expect(station.longitude).to eq(-121.784217)
      expect(station.title).to eq('Livermore')
    end

    it 'normalizes OZONE to Ozone' do
      stations = parser.call(data: sample_data)
      ozone_station = stations.find { |s| s.measurement_type == 'Ozone' }

      expect(ozone_station).to be_present
    end

    it 'skips unsupported parameters' do
      stations = parser.call(data: sample_data)
      co_station = stations.find { |s| s.measurement_type == 'CO' }

      expect(co_station).to be_nil
    end

    it 'skips rows with missing AQSID' do
      stations = parser.call(data: sample_data)
      aqsids = stations.map(&:external_ref)

      expect(aqsids).not_to include('')
      expect(aqsids).not_to include(nil)
    end

    it 'uses AQSID as title when station name is missing' do
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
    end
  end
end
