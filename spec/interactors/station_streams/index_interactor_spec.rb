require 'rails_helper'

RSpec.describe StationStreams::IndexInteractor do
  describe '#call' do
    let(:valid_params) do
      {
        time_from: 1.day.ago,
        time_to: Time.current,
        sensor_name: 'government-pm2.5',
        measurement_type: 'Particulate Matter',
        unit_symbol: 'µg/m³',
        tags: '',
        usernames: '',
        west: 5.0,
        east: 25.0,
        north: 55.0,
        south: 45.0,
      }
    end

    let(:contract) { Api::FixedSessionsContract.new.call(valid_params) }
    let(:stream_configuration) { create(:stream_configuration, measurement_type: 'PM2.5') }

    it 'returns Success with serialized station streams' do
      station_stream = create(
        :station_stream,
        stream_configuration: stream_configuration,
        location: 'SRID=4326;POINT(10.0 50.0)',
        first_measured_at: 2.hours.ago,
        last_measured_at: 1.hour.ago,
      )
      create(
        :station_measurement,
        station_stream: station_stream,
        measured_at: station_stream.last_measured_at,
        value: 30.0,
      )

      result = described_class.new(contract: contract).call

      expect(result).to be_success
      expect(result.value['fetchableSessionsCount']).to eq(1)
      expect(result.value['sessions'].first['id']).to eq(station_stream.id)
      expect(result.value['sessions'].first['last_measurement_value']).to eq(30)
    end

    it 'returns Failure when contract is invalid' do
      invalid_params = valid_params.merge(sensor_name: nil)
      invalid_contract = Api::FixedSessionsContract.new.call(invalid_params)

      result = described_class.new(contract: invalid_contract).call

      expect(result).to be_failure
      expect(result.errors).to have_key(:sensor_name)
    end

    it 'returns empty sessions when no streams match' do
      result = described_class.new(contract: contract).call

      expect(result).to be_success
      expect(result.value['fetchableSessionsCount']).to eq(0)
      expect(result.value['sessions']).to eq([])
    end

    it 'accepts custom repository and serializer' do
      repository = instance_double(StationStreamsRepository)
      serializer = instance_double(StationStreamsSerializer)
      station_streams = []

      allow(repository).to receive(:active_in_rectangle).and_return(station_streams)
      allow(serializer).to receive(:call).with(station_streams).and_return(
        { 'fetchableSessionsCount' => 0, 'sessions' => [] },
      )

      result = described_class.new(
        contract: contract,
        repository: repository,
        serializer: serializer,
      ).call

      expect(result).to be_success
      expect(repository).to have_received(:active_in_rectangle).with(
        sensor_name: 'government-pm2.5',
        east: 25.0,
        west: 5.0,
        north: 55.0,
        south: 45.0,
      )
    end
  end
end
