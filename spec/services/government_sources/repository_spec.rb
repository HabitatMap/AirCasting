require 'rails_helper'

describe GovernmentSources::Repository do
  subject { described_class.new }

  describe '#existing_station_keys' do
    it 'returns set of measurement_type and external_ref pairs for EPA source' do
      source = create(:source, name: 'EPA')
      stream_config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      create(
        :fixed_stream,
        source_id: source.id,
        stream_configuration_id: stream_config.id,
        external_ref: 'REF123',
      )

      keys = subject.existing_station_keys(source_name: :epa)

      expect(keys).to include(%w[PM2.5 REF123])
    end

    it 'returns set of measurement_type and external_ref pairs for EEA source' do
      source = create(:source, name: 'EEA')
      stream_config =
        create(
          :stream_configuration,
          measurement_type: 'Ozone',
          canonical: true,
        )
      create(
        :fixed_stream,
        source_id: source.id,
        stream_configuration_id: stream_config.id,
        external_ref: 'EEA_REF',
      )

      keys = subject.existing_station_keys(source_name: :eea)

      expect(keys).to include(%w[Ozone EEA_REF])
    end

    it 'does not include keys from other sources' do
      epa_source = create(:source, name: 'EPA')
      eea_source = create(:source, name: 'EEA')
      stream_config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      create(
        :fixed_stream,
        source_id: epa_source.id,
        stream_configuration_id: stream_config.id,
        external_ref: 'EPA_REF',
      )

      keys = subject.existing_station_keys(source_name: :eea)

      expect(keys).not_to include(%w[PM2.5 EPA_REF])
    end
  end

  describe '#source_id' do
    it 'returns source ID for EPA' do
      source = create(:source, name: 'EPA')

      expect(subject.source_id(source_name: :epa)).to eq(source.id)
    end

    it 'returns source ID for EEA' do
      source = create(:source, name: 'EEA')

      expect(subject.source_id(source_name: :eea)).to eq(source.id)
    end
  end

  describe '#user' do
    it 'returns EPA user' do
      user = create(:user, username: 'US EPA AirNow')

      expect(subject.user(source_name: :epa)).to eq(user)
    end

    it 'returns EEA user' do
      user = create(:user, username: 'EEA')

      expect(subject.user(source_name: :eea)).to eq(user)
    end
  end

  describe '#sensor_package_name' do
    it 'returns epa for EPA source' do
      expect(subject.sensor_package_name(source_name: :epa)).to eq('epa')
    end

    it 'returns eea for EEA source' do
      expect(subject.sensor_package_name(source_name: :eea)).to eq('eea')
    end
  end

  describe '#stream_configurations' do
    it 'returns canonical stream configurations indexed by measurement_type' do
      pm25_config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      ozone_config =
        create(
          :stream_configuration,
          measurement_type: 'Ozone',
          canonical: true,
        )
      create(:stream_configuration, measurement_type: 'CO', canonical: false)

      configs = subject.stream_configurations

      expect(configs['PM2.5']).to eq(pm25_config)
      expect(configs['Ozone']).to eq(ozone_config)
      expect(configs['CO']).to be_nil
    end
  end

  describe '#existing_station_stream_keys' do
    it 'returns set of measurement_type and external_ref pairs for source' do
      source = create(:source, name: 'EPA')
      stream_config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      create(
        :station_stream,
        source: source,
        stream_configuration: stream_config,
        external_ref: 'REF123',
      )

      keys = subject.existing_station_stream_keys(source_name: :epa)

      expect(keys).to include(%w[PM2.5 REF123])
    end

    it 'does not include keys from other sources' do
      epa_source = create(:source, name: 'EPA')
      eea_source = create(:source, name: 'EEA')
      stream_config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )
      create(
        :station_stream,
        source: epa_source,
        stream_configuration: stream_config,
        external_ref: 'EPA_REF',
      )

      keys = subject.existing_station_stream_keys(source_name: :eea)

      expect(keys).not_to include(%w[PM2.5 EPA_REF])
    end
  end

  describe '#station_stream_url_token_available?' do
    it 'returns false when token exists' do
      source = create(:source, name: 'EPA')
      stream_config = create(:stream_configuration, canonical: true)
      create(:station_stream, source: source, stream_configuration: stream_config, url_token: 'abc123')

      expect(subject.station_stream_url_token_available?('abc123')).to be false
    end

    it 'returns true when token does not exist' do
      expect(subject.station_stream_url_token_available?('nonexistent')).to be true
    end
  end

  describe '#upsert_station_streams' do
    it 'creates new station streams' do
      source = create(:source, name: 'EPA')
      stream_config = create(:stream_configuration, canonical: true)
      factory = RGeo::Geographic.spherical_factory(srid: 4326)

      records = [
        {
          source_id: source.id,
          stream_configuration_id: stream_config.id,
          external_ref: 'REF123',
          location: factory.point(-74.006, 40.7128),
          time_zone: 'America/New_York',
          title: 'Test Station',
          url_token: 'abc123',
          created_at: Time.current,
          updated_at: Time.current,
        },
      ]

      expect { subject.upsert_station_streams(records:) }.to change(StationStream, :count).by(1)
    end

    it 'updates existing station streams on conflict' do
      source = create(:source, name: 'EPA')
      stream_config = create(:stream_configuration, canonical: true)
      factory = RGeo::Geographic.spherical_factory(srid: 4326)

      create(
        :station_stream,
        source: source,
        stream_configuration: stream_config,
        external_ref: 'REF123',
        title: 'Old Title',
      )

      records = [
        {
          source_id: source.id,
          stream_configuration_id: stream_config.id,
          external_ref: 'REF123',
          location: factory.point(-74.006, 40.7128),
          time_zone: 'America/New_York',
          title: 'New Title',
          url_token: 'xyz789',
          created_at: Time.current,
          updated_at: Time.current,
        },
      ]

      expect { subject.upsert_station_streams(records:) }.not_to change(StationStream, :count)
      expect(StationStream.last.title).to eq('New Title')
    end
  end
end
