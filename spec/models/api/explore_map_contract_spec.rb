require 'rails_helper'

RSpec.describe Api::ExploreMapContract do
  subject(:contract) { described_class.new }

  let(:viewport) { { west: '-75', east: '-73', south: '40', north: '41', zoom: '9' } }

  it 'coerces the viewport and zoom, which arrive as query-string text' do
    result = contract.call(viewport)

    expect(result).to be_success
    expect(result.to_h).to eq(west: -75.0, east: -73.0, south: 40.0, north: 41.0, zoom: 9)
  end

  it 'accepts west > east: the viewport crosses the antimeridian' do
    expect(contract.call(viewport.merge(west: '170', east: '-170'))).to be_success
  end

  it 'requires every viewport edge and the zoom' do
    result = contract.call({})

    expect(result.errors.to_h.keys).to contain_exactly(:west, :east, :south, :north, :zoom)
  end

  it 'rejects a coordinate out of range' do
    result = contract.call(viewport.merge(west: '-181', north: '91'))

    expect(result.errors.to_h.keys).to contain_exactly(:west, :north)
  end

  it 'rejects north below south' do
    result = contract.call(viewport.merge(south: '41', north: '40'))

    expect(result.errors[:north]).to eq(['must be greater than or equal to south'])
  end

  describe 'zoom' do
    it 'rejects a fractional zoom: the client rounds it' do
      expect(contract.call(viewport.merge(zoom: '9.5')).errors[:zoom]).to be_present
    end

    it 'rejects a zoom out of range' do
      expect(contract.call(viewport.merge(zoom: '-1')).errors[:zoom]).to be_present
      expect(contract.call(viewport.merge(zoom: '23')).errors[:zoom]).to be_present
    end
  end

  describe 'sources and measurement_types' do
    it 'accepts comma-separated known values' do
      result = contract.call(viewport.merge(sources: 'airbeam,government', measurement_types: 'Particulate Matter, Ozone'))

      expect(result).to be_success
    end

    it 'accepts empty values, which mean all' do
      expect(contract.call(viewport.merge(sources: '', measurement_types: ''))).to be_success
    end

    it 'rejects an unknown value instead of ignoring it' do
      result = contract.call(viewport.merge(sources: 'airbeam,purpleair', measurement_types: 'Particulate Matter,PM10'))

      expect(result.errors[:sources]).to eq(['unknown: purpleair'])
      expect(result.errors[:measurement_types]).to eq(['unknown: PM10'])
    end
  end

  describe '.list' do
    it 'splits, strips and de-duplicates, dropping empty entries' do
      expect(described_class.list(' Ozone,,Particulate Matter ,Ozone')).to eq(['Ozone', 'Particulate Matter'])
    end

    it 'is empty for nil' do
      expect(described_class.list(nil)).to eq([])
    end
  end
end
