require 'rails_helper'

RSpec.describe Timelapse::SpatialClusterer do
  subject { described_class.new }

  describe '#cluster' do
    it 'clusters two close points together' do
      items = [
        Timelapse::Locatable.new(id: 1, latitude: 50.0, longitude: 19.0),
        Timelapse::Locatable.new(id: 2, latitude: 50.0001, longitude: 19.0001),
      ]

      clusters = subject.cluster(items, 10)

      expect(clusters.length).to eq(1)
      expect(clusters.first[:ids]).to contain_exactly(1, 2)
      expect(clusters.first[:count]).to eq(2)
    end

    it 'keeps far-apart points in separate clusters' do
      items = [
        Timelapse::Locatable.new(id: 1, latitude: 50.0, longitude: 19.0),
        Timelapse::Locatable.new(id: 2, latitude: 60.0, longitude: 29.0),
      ]

      clusters = subject.cluster(items, 10)

      expect(clusters.length).to eq(2)
      expect(clusters.map { |c| c[:ids] }).to contain_exactly([1], [2])
    end

    it 'returns a singleton cluster for a single point' do
      items = [
        Timelapse::Locatable.new(id: 1, latitude: 50.0, longitude: 19.0),
      ]

      clusters = subject.cluster(items, 10)

      expect(clusters.length).to eq(1)
      expect(clusters.first[:ids]).to eq([1])
      expect(clusters.first[:count]).to eq(1)
    end

    it 'returns empty array for empty input' do
      clusters = subject.cluster([], 10)

      expect(clusters).to eq([])
    end

    it 'calculates cluster centroid as average of member coordinates' do
      items = [
        Timelapse::Locatable.new(id: 1, latitude: 50.0, longitude: 19.0),
        Timelapse::Locatable.new(id: 2, latitude: 50.0002, longitude: 19.0002),
      ]

      clusters = subject.cluster(items, 10)

      expect(clusters.length).to eq(1)
      expect(clusters.first[:latitude]).to eq(50.0001)
      expect(clusters.first[:longitude]).to eq(19.0001)
    end

    it 'sorts clusters by count descending' do
      # Create 3 close points and 1 far point
      items = [
        Timelapse::Locatable.new(id: 1, latitude: 50.0, longitude: 19.0),
        Timelapse::Locatable.new(id: 2, latitude: 50.0001, longitude: 19.0001),
        Timelapse::Locatable.new(id: 3, latitude: 50.0002, longitude: 19.0002),
        Timelapse::Locatable.new(id: 4, latitude: 60.0, longitude: 29.0),
      ]

      clusters = subject.cluster(items, 10)

      expect(clusters.first[:count]).to be >= clusters.last[:count]
    end
  end
end
