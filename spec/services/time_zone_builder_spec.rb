require 'rails_helper'

describe TimeZoneBuilder do
  subject { described_class.new }
  describe '#call' do
    it 'returns correct timezone' do
      expect(subject.call(50.0640, 19.9440)).to eq('Europe/Warsaw')
      expect(subject.call(37.7749, -122.4194)).to eq('America/Los_Angeles')
    end

    it 'returns default UTC when latitude or longitude is nil' do
      expect(subject.call(nil, 1.0)).to eq('UTC')
    end

    it 'returns default UTC when latitude or longitude is 0.0' do
      expect(subject.call(0.0, 1.0)).to eq('UTC')
    end

    it 'returns default UTC when latitude or longitude is out of bounds' do
      expect(subject.call(91.0, 1.0)).to eq('UTC')
    end
  end
end
