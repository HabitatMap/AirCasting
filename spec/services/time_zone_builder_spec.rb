require 'rails_helper'

describe TimeZoneBuilder do
  describe '#call' do
    it 'returns correct timezone' do
      expect(TimeZoneBuilder.new.call(50.0640, 19.9440)).to eq('Europe/Warsaw')
      expect(TimeZoneBuilder.new.call(37.7749, -122.4194)).to eq('America/Los_Angeles')
    end

    it 'returns default UTC when latitude or longitude is nil' do
      expect(TimeZoneBuilder.new.call(nil, 1.0)).to eq('UTC')
    end

    it 'returns default UTC when latitude or longitude is 0.0' do
      expect(TimeZoneBuilder.new.call(0.0, 1.0)).to eq('UTC')
    end

    it 'returns default UTC when latitude or longitude is out of bounds' do
      expect(TimeZoneBuilder.new.call(91.0, 1.0)).to eq('UTC')
    end
  end
end
