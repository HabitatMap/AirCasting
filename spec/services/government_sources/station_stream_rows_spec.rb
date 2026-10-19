require 'rails_helper'

describe GovernmentSources::StationStreamRows do
  describe '.supported_measurement_type?' do
    it 'returns true for PM2.5' do
      expect(described_class.supported_measurement_type?('PM2.5')).to be true
    end

    it 'returns true for Ozone' do
      expect(described_class.supported_measurement_type?('Ozone')).to be true
    end

    it 'returns true for NO2' do
      expect(described_class.supported_measurement_type?('NO2')).to be true
    end

    it 'returns false for unsupported types' do
      expect(described_class.supported_measurement_type?('CO')).to be false
      expect(described_class.supported_measurement_type?(nil)).to be false
    end
  end

  describe '.deduplicate' do
    it 'removes duplicate rows by external_ref and measurement_type' do
      row1 =
        GovernmentSources::StationStreamRow.new(
          external_ref: 'REF1',
          measurement_type: 'PM2.5',
          latitude: 40.0,
          longitude: -74.0,
        )
      row2 =
        GovernmentSources::StationStreamRow.new(
          external_ref: 'REF1',
          measurement_type: 'PM2.5',
          latitude: 41.0,
          longitude: -75.0,
        )
      row3 =
        GovernmentSources::StationStreamRow.new(
          external_ref: 'REF1',
          measurement_type: 'Ozone',
          latitude: 40.0,
          longitude: -74.0,
        )

      result = described_class.deduplicate([row1, row2, row3])

      expect(result.count).to eq(2)
      expect(result).to include(row1)
      expect(result).to include(row3)
    end

    it 'returns empty array for empty input' do
      expect(described_class.deduplicate([])).to eq([])
    end
  end
end
