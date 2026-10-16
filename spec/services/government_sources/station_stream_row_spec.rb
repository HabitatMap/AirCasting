require 'rails_helper'

describe GovernmentSources::StationStreamRow do
  describe '#valid?' do
    it 'returns true when all required fields are present' do
      row = described_class.new(
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
      )

      expect(row.valid?).to be true
    end

    it 'returns false when external_ref is missing' do
      row = described_class.new(
        external_ref: nil,
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
      )

      expect(row.valid?).to be false
    end

    it 'returns false when external_ref is blank' do
      row = described_class.new(
        external_ref: '',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
      )

      expect(row.valid?).to be false
    end

    it 'returns false when latitude is missing' do
      row = described_class.new(
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: nil,
        longitude: -74.006,
      )

      expect(row.valid?).to be false
    end

    it 'returns false when longitude is missing' do
      row = described_class.new(
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: nil,
      )

      expect(row.valid?).to be false
    end
  end
end
