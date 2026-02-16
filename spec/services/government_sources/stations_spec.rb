require 'rails_helper'

describe GovernmentSources::Stations do
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
    it 'removes duplicate stations by external_ref and measurement_type' do
      station1 =
        GovernmentSources::Station.new(
          external_ref: 'REF1',
          measurement_type: 'PM2.5',
          latitude: 40.0,
          longitude: -74.0,
        )
      station2 =
        GovernmentSources::Station.new(
          external_ref: 'REF1',
          measurement_type: 'PM2.5',
          latitude: 41.0,
          longitude: -75.0,
        )
      station3 =
        GovernmentSources::Station.new(
          external_ref: 'REF1',
          measurement_type: 'Ozone',
          latitude: 40.0,
          longitude: -74.0,
        )

      result = described_class.deduplicate([station1, station2, station3])

      expect(result.count).to eq(2)
      expect(result).to include(station1)
      expect(result).to include(station3)
    end

    it 'returns empty array for empty input' do
      expect(described_class.deduplicate([])).to eq([])
    end
  end

  describe '.to_float' do
    it 'converts valid numeric string to float' do
      expect(described_class.to_float('40.7128')).to eq(40.7128)
    end

    it 'returns nil for invalid string' do
      expect(described_class.to_float('invalid')).to be_nil
    end

    it 'returns nil for nil' do
      expect(described_class.to_float(nil)).to be_nil
    end

    it 'returns nil for empty string' do
      expect(described_class.to_float('')).to be_nil
    end
  end
end
