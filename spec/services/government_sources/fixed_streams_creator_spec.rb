require 'rails_helper'

describe GovernmentSources::FixedStreamsCreator do
  let(:source) { create(:source, name: 'EPA') }
  let(:user) { create(:user, username: 'US EPA AirNow') }
  let(:stream_configuration) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let(:threshold_set) do
    create(:threshold_set, sensor_name: 'Government-PM2.5')
  end

  subject { described_class.new }

  describe '#call' do
    it 'creates FixedSession, Stream, and FixedStream for stations' do
      source
      user
      stream_configuration
      threshold_set

      station =
        build_station(
          source_id: source.id,
          stream_configuration_id: stream_configuration.id,
        )

      expect { subject.call(stations: [station], source_name: :epa) }.to change(
        FixedSession,
        :count,
      ).by(1).and change(Stream, :count).by(1).and change(FixedStream, :count)
                                        .by(1)
    end

    it 'creates FixedSession with correct attributes' do
      user
      source
      stream_configuration
      threshold_set

      station =
        build_station(
          source_id: source.id,
          stream_configuration_id: stream_configuration.id,
        )

      subject.call(stations: [station], source_name: :epa)

      session = FixedSession.last
      expect(session.user_id).to eq(user.id)
      expect(session.title).to eq('Test Station')
      expect(session.latitude).to eq(40.7128)
      expect(session.longitude).to eq(-74.006)
      expect(session.time_zone).to eq('America/New_York')
      expect(session.contribute).to be true
      expect(session.is_indoor).to be false
    end

    it 'creates Stream with correct attributes' do
      user
      source
      stream_configuration
      threshold_set

      station =
        build_station(
          source_id: source.id,
          stream_configuration_id: stream_configuration.id,
        )

      subject.call(stations: [station], source_name: :epa)

      stream = Stream.last
      expect(stream.sensor_name).to eq('Government-PM2.5')
      expect(stream.sensor_package_name).to eq('epa')
      expect(stream.measurement_type).to eq('Particulate Matter')
      expect(stream.unit_symbol).to eq('µg/m³')
      expect(stream.threshold_set_id).to eq(threshold_set.id)
    end

    it 'creates FixedStream with correct attributes' do
      user
      source
      stream_configuration
      threshold_set

      station =
        build_station(
          source_id: source.id,
          stream_configuration_id: stream_configuration.id,
        )

      subject.call(stations: [station], source_name: :epa)

      fixed_stream = FixedStream.last
      expect(fixed_stream.external_ref).to eq('REF123')
      expect(fixed_stream.source_id).to eq(source.id)
      expect(fixed_stream.stream_configuration_id).to eq(
        stream_configuration.id,
      )
      expect(fixed_stream.title).to eq('Test Station')
      expect(fixed_stream.time_zone).to eq('America/New_York')
    end

    it 'does nothing when stations array is empty' do
      expect { subject.call(stations: [], source_name: :epa) }.not_to change(
        FixedStream,
        :count,
      )
    end

    it 'works with EEA source' do
      eea_source = create(:source, name: 'EEA')
      eea_user = create(:user, username: 'EEA')
      stream_configuration
      threshold_set

      station =
        build_station(
          source_id: eea_source.id,
          stream_configuration_id: stream_configuration.id,
        )

      subject.call(stations: [station], source_name: :eea)

      session = FixedSession.last
      expect(session.user_id).to eq(eea_user.id)

      stream = Stream.last
      expect(stream.sensor_package_name).to eq('eea')
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
        source_id: 1,
        stream_configuration_id: 1,
      }.merge(overrides),
    )
  end
end
