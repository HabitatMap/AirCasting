require 'rails_helper'

describe Explore::Map do
  let(:airbeam_query) { instance_double(Explore::AirbeamItemsQuery, call: []) }
  let(:gov_query) { instance_double(Explore::GovItemsQuery, call: []) }
  let(:viewport) { { west: -74.1, east: -73.9, south: 40.6, north: 40.8, zoom: 10 } }

  before do
    allow(Explore::AirbeamItemsQuery).to receive(:new).and_return(airbeam_query)
    allow(Explore::GovItemsQuery).to receive(:new).and_return(gov_query)
  end

  def item(source:, values: [10.0], latitude: 40.7, longitude: -74.0)
    Explore::Item.new(
      source: source,
      latitude: latitude,
      longitude: longitude,
      streams:
        values.map do |value|
          Explore::ItemStream.new(parameter: 'Particulate Matter', last_value: value)
        end,
    )
  end

  it 'queries every source when none is selected' do
    subject.call(**viewport)

    expect(airbeam_query).to have_received(:call)
    expect(gov_query).to have_received(:call)
  end

  it 'queries only the selected sources' do
    subject.call(**viewport, sources: %w[government])

    expect(airbeam_query).not_to have_received(:call)
    expect(gov_query).to have_received(:call)
  end

  it 'queries the viewport snapped outward to whole grid cells, with the selected measurement types' do
    subject.call(**viewport, sources: %w[government], measurement_types: %w[Ozone])

    expect(gov_query).to have_received(:call) do |bounds:, parameters:|
      snapped = MapGrid.new(10).snap(**viewport.except(:zoom))
      expect(%i[west east south north].to_h { |edge| [edge, bounds.public_send(edge)] }).to eq(snapped)
      expect(bounds.west).to be < viewport[:west]
      expect(bounds.east).to be > viewport[:east]
      expect(parameters.keys).to eq(%w[Ozone])
    end
  end

  it 'clusters the items of all sources together' do
    allow(airbeam_query).to receive(:call).and_return([item(source: 'airbeam')])
    allow(gov_query).to receive(:call).and_return([item(source: 'government', latitude: 40.7001)])

    markers = subject.call(**viewport)

    expect(markers).to match([have_attributes(class: Explore::Cluster, count: 2)])
  end

  describe 'value' do
    let(:station) { item(source: 'government', values: [10.0, 20.0]) }

    before { allow(gov_query).to receive(:call).and_return([station]) }

    it 'is the mean of the streams of the one selected measurement type' do
      subject.call(**viewport, measurement_types: ['Particulate Matter'])

      expect(station.value).to eq(15.0)
    end

    it 'is not set when several measurement types are selected' do
      subject.call(**viewport, measurement_types: ['Particulate Matter', 'Ozone'])

      expect(station.value).to be_nil
    end

    it 'is not set when none is selected, which means all' do
      subject.call(**viewport)

      expect(station.value).to be_nil
    end
  end
end
