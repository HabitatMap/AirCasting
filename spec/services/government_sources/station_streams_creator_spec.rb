require 'rails_helper'

describe GovernmentSources::StationStreamsCreator do
  let(:source) { create(:source, name: 'EPA') }
  let(:stream_configuration) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end

  subject { described_class.new }

  describe '#call' do
    it 'creates StationStream with correct attributes' do
      station =
        build_station(
          source_id: source.id,
          stream_configuration_id: stream_configuration.id,
        )

      expect { subject.call(stations: [station]) }.to change(
        StationStream,
        :count,
      ).by(1)

      station_stream = StationStream.last
      expect(station_stream.external_ref).to eq('REF123')
      expect(station_stream.source_id).to eq(source.id)
      expect(station_stream.stream_configuration_id).to eq(
        stream_configuration.id,
      )
      expect(station_stream.title).to eq('Test Station')
      expect(station_stream.time_zone).to eq('America/New_York')
      expect(station_stream.url_token).to eq('abc123')
      expect(station_stream.uuid).to be_present
    end

    it 'upserts existing station streams by unique key' do
      create(
        :station_stream,
        external_ref: 'REF123',
        source: source,
        stream_configuration: stream_configuration,
        title: 'Original Station',
      )

      station =
        build_station(
          source_id: source.id,
          stream_configuration_id: stream_configuration.id,
          title: 'Updated Station',
        )

      expect { subject.call(stations: [station]) }.not_to change(
        StationStream,
        :count,
      )

      expect(StationStream.last.title).to eq('Updated Station')
    end
  end

  private

  def build_station(overrides = {})
    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    GovernmentSources::Station.new(
      {
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
        location: factory.point(-74.006, 40.7128),
        time_zone: 'America/New_York',
        title: 'Test Station',
        url_token: 'abc123',
        source_id: nil,
        stream_configuration_id: nil,
      }.merge(overrides),
    )
  end
end
