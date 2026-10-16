require 'rails_helper'

describe MapGrid do
  describe '#cell_size' do
    it 'matches the web map grid' do
      sizes = [3, 7, 8, 10, 11, 12, 16].to_h { |zoom| [zoom, described_class.new(zoom).cell_size] }

      expect(sizes).to eq(
        3 => 25,
        7 => 25,
        8 => 25,
        10 => 25 / 1.3**2,
        11 => 25 / 1.3**3,
        12 => 5,
        16 => 5,
      )
    end
  end

  describe '#cell' do
    it 'puts nearby points in one cell and distant ones apart' do
      grid = described_class.new(5)

      expect(grid.cell(40.70, -74.00)).to eq(grid.cell(40.71, -74.01))
      expect(grid.cell(40.70, -74.00)).not_to eq(grid.cell(52.2, 21.0))
    end
  end

  describe '#snap' do
    let(:grid) { described_class.new(6) }
    let(:viewport) { { west: -74.3, east: -73.6, south: 40.5, north: 40.9 } }

    it 'grows the viewport to contain every point of its edge cells' do
      snapped = grid.snap(**viewport)

      expect(snapped[:west]).to be <= viewport[:west]
      expect(snapped[:east]).to be >= viewport[:east]
      expect(snapped[:south]).to be <= viewport[:south]
      expect(snapped[:north]).to be >= viewport[:north]

      # Just inside the snapped edges is still the edge cell of the viewport.
      expect(grid.cell(viewport[:north], snapped[:west] + 1e-6)).to eq(
        grid.cell(viewport[:north], viewport[:west]),
      )
      expect(grid.cell(snapped[:south] + 1e-6, viewport[:east])).to eq(
        grid.cell(viewport[:south], viewport[:east]),
      )
    end

    it 'leaves a snapped viewport as it is' do
      snapped = grid.snap(**viewport)

      grid.snap(**snapped).each { |edge, value| expect(value).to be_within(1e-9).of(snapped[edge]) }
    end

    it 'keeps a viewport across the antimeridian crossing it' do
      snapped = grid.snap(west: 170, east: -170, south: -20, north: -10)

      expect(snapped[:west]).to be_between(160, 170)
      expect(snapped[:east]).to be_between(-170, -160)
    end

    it 'covers every longitude when an antimeridian viewport grows past itself' do
      snapped = grid.snap(west: 10.0, east: 9.99, south: -20, north: -10)

      expect(snapped.values_at(:west, :east)).to eq([-180.0, 180.0])
    end

    it 'stays inside the world' do
      snapped = grid.snap(west: -180, east: 180, south: -90, north: 90)

      expect(snapped.values_at(:west, :east)).to eq([-180.0, 180.0])
      expect(snapped[:south]).to be_within(1e-6).of(-MapGrid::MAX_LATITUDE)
      expect(snapped[:north]).to be_within(1e-6).of(MapGrid::MAX_LATITUDE)
    end
  end
end
