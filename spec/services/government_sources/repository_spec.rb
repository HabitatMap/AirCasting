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
end
