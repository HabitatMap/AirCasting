require 'rails_helper'

describe GovernmentSources do
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
