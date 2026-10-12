require 'rails_helper'

describe Eea::Stations::DataParser do
  let(:fixture_path) { file_fixture('eea_stations_sample.csv').to_s }
  let(:parser) { described_class.new }

  describe '#call' do
    it 'parses rows from CSV data' do
      rows = parser.call(file_path: fixture_path)

      expect(rows.count).to eq(7)
    end

    it 'extracts row attributes correctly' do
      rows = parser.call(file_path: fixture_path)
      row = rows.first

      expect(row.external_ref).to eq('SPO-AD0942A-6001')
      expect(row.measurement_type).to eq('PM2.5')
      expect(row.latitude).to eq(42.509690)
      expect(row.longitude).to eq(1.539140)
      expect(row.title).to eq('Escaldes-Engordany')
    end

    it 'normalizes O3 to Ozone' do
      rows = parser.call(file_path: fixture_path)
      ozone_row = rows.find { |s| s.measurement_type == 'Ozone' }

      expect(ozone_row).to be_present
    end

    it 'skips unsupported pollutants' do
      rows = parser.call(file_path: fixture_path)
      so2_row = rows.find { |s| s.measurement_type == 'SO2' }

      expect(so2_row).to be_nil
    end

    it 'skips rows with missing external_ref' do
      rows = parser.call(file_path: fixture_path)
      external_refs = rows.map(&:external_ref)

      expect(external_refs).not_to include('')
      expect(external_refs).not_to include(nil)
    end

    it 'uses Sampling Point Id as title when station name is missing' do
      rows = parser.call(file_path: fixture_path)
      row = rows.find { |s| s.external_ref == 'SPO-PL0004' }

      expect(row.title).to eq('SPO-PL0004')
    end

    it 'deduplicates rows by external_ref and measurement_type' do
      rows = parser.call(file_path: fixture_path)
      pm25_rows =
        rows.select do |s|
          s.external_ref == 'SPO-AD0942A-6001' && s.measurement_type == 'PM2.5'
        end

      expect(pm25_rows.count).to eq(1)
    end

    it 'returns rows without enriched fields' do
      rows = parser.call(file_path: fixture_path)
      row = rows.first

      expect(row.location).to be_nil
      expect(row.time_zone).to be_nil
      expect(row.source_id).to be_nil
      expect(row.stream_configuration_id).to be_nil
    end
  end
end
