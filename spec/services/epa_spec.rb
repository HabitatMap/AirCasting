require 'rails_helper'

describe Epa do
  describe '.normalized_measurement_type' do
    it 'returns PM2.5 for PM2.5' do
      expect(described_class.normalized_measurement_type('PM2.5')).to eq('PM2.5')
    end

    it 'returns Ozone for O3' do
      expect(described_class.normalized_measurement_type('O3')).to eq('Ozone')
    end

    it 'returns Ozone for OZONE' do
      expect(described_class.normalized_measurement_type('OZONE')).to eq('Ozone')
    end

    it 'returns NO2 for NO2' do
      expect(described_class.normalized_measurement_type('NO2')).to eq('NO2')
    end

    it 'returns nil for unsupported parameter' do
      expect(described_class.normalized_measurement_type('CO')).to be_nil
    end
  end

  describe '.sanitize_data' do
    it 'returns valid UTF-8 string unchanged' do
      data = 'Hello World'
      expect(described_class.sanitize_data(data)).to eq('Hello World')
    end

    it 'replaces invalid byte sequences with replacement character' do
      data = "Hello\x80World".force_encoding('UTF-8')
      result = described_class.sanitize_data(data)

      expect(result).to eq("Hello\uFFFDWorld")
      expect(result.encoding).to eq(Encoding::UTF_8)
    end

    it 'handles ASCII-8BIT encoded data' do
      data = "Test\xFFData".force_encoding('ASCII-8BIT')
      result = described_class.sanitize_data(data)

      expect(result.encoding).to eq(Encoding::UTF_8)
      expect(result).to include('Test')
      expect(result).to include('Data')
    end
  end
end
