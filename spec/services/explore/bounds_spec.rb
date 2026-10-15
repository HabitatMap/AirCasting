require 'rails_helper'

describe Explore::Bounds do
  describe '#boxes' do
    it 'is the rectangle itself when it does not cross the antimeridian' do
      bounds = described_class.new(west: -75, east: -73, south: 40, north: 41)

      expect(bounds.boxes).to eq([[-75.0, 40.0, -73.0, 41.0]])
    end

    it 'splits a rectangle across the antimeridian into one box per side' do
      bounds = described_class.new(west: 170, east: -170, south: -20, north: -10)

      expect(bounds.crosses_antimeridian?).to be(true)
      expect(bounds.boxes).to eq(
        [[170.0, -20.0, 180.0, -10.0], [-180.0, -20.0, -170.0, -10.0]],
      )
    end
  end

  it 'rejects a coordinate that is not a number' do
    expect {
      described_class.new(west: 'x', east: 1, south: 1, north: 2)
    }.to raise_error(ArgumentError)
  end
end
