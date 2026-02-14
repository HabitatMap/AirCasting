require 'rails_helper'

describe GovernmentSources::Station do
  describe '#valid?' do
    it 'returns true when all required fields are present' do
      station = described_class.new(
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
      )

      expect(station.valid?).to be true
    end

    it 'returns false when external_ref is missing' do
      station = described_class.new(
        external_ref: nil,
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
      )

      expect(station.valid?).to be false
    end

    it 'returns false when external_ref is blank' do
      station = described_class.new(
        external_ref: '',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
      )

      expect(station.valid?).to be false
    end

    it 'returns false when latitude is missing' do
      station = described_class.new(
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: nil,
        longitude: -74.006,
      )

      expect(station.valid?).to be false
    end

    it 'returns false when longitude is missing' do
      station = described_class.new(
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: nil,
      )

      expect(station.valid?).to be false
    end
  end
end
