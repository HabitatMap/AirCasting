require 'rails_helper'

RSpec.describe DataFixes::EpaDataMigrator do
  def create_epa_session(**attrs)
    create(:fixed_session, uuid: SecureRandom.uuid, **attrs)
  end
  let(:api_client) { instance_double(Epa::ApiClient) }
  let(:data_parser) { instance_double(Epa::Stations::DataParser) }

  subject do
    described_class.new(api_client: api_client, data_parser: data_parser)
  end

  let!(:epa_user) { create(:user, username: 'US EPA AirNow') }
  let!(:epa_source) { create(:source, name: 'EPA') }
  let!(:pm25_config) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let!(:no2_config) do
    create(:stream_configuration, measurement_type: 'NO2', canonical: true)
  end
  let!(:ozone_config) do
    create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
  end
  let!(:pm25_threshold) { create(:threshold_set, :air_now_pm2_5) }

  before do
    allow(api_client).to receive(:fetch_locations).and_return('')
    allow(data_parser).to receive(:call).and_return([])
  end

  describe '#call' do
    context 'when there are streams to migrate' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }
      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
          time_zone: 'America/New_York',
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end
      let!(:measurement1) do
        create(
          :fixed_measurement,
          stream: stream,
          value: 12.5,
          time_with_time_zone: Time.zone.parse('2025-01-15 10:00:00 UTC'),
        )
      end
      let!(:measurement2) do
        create(
          :fixed_measurement,
          stream: stream,
          value: 15.0,
          time_with_time_zone: Time.zone.parse('2025-01-15 11:00:00 UTC'),
        )
      end
      let!(:daily_average) do
        create(
          :stream_daily_average,
          stream: stream,
          date: Date.new(2025, 1, 15),
          value: 14,
        )
      end

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: latitude,
          longitude: longitude,
          title: 'Test Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'creates a StationStream record' do
        expect { subject.call }.to change(StationStream, :count).by(1)
      end

      it 'creates StationStream with correct attributes' do
        subject.call

        station_stream = StationStream.last
        expect(station_stream.source_id).to eq(epa_source.id)
        expect(station_stream.stream_configuration_id).to eq(pm25_config.id)
        expect(station_stream.external_ref).to eq('ABC123')
        expect(station_stream.time_zone).to eq('America/New_York')
        expect(station_stream.title).to eq(session.title)
      end

      it 'preserves the session uuid for mobile app compatibility' do
        subject.call

        station_stream = StationStream.last
        expect(station_stream.uuid).to eq(session.uuid)
      end

      it 'sets first_measured_at and last_measured_at from measurements' do
        subject.call

        station_stream = StationStream.last
        expect(station_stream.first_measured_at).to eq(
          Time.zone.parse('2025-01-15 10:00:00 UTC'),
        )
        expect(station_stream.last_measured_at).to eq(
          Time.zone.parse('2025-01-15 11:00:00 UTC'),
        )
      end

      it 'copies measurements to station_measurements' do
        expect { subject.call }.to change(StationMeasurement, :count).by(2)
      end

      it 'copies measurement values correctly' do
        subject.call

        station_stream = StationStream.last
        measurements =
          StationMeasurement.where(station_stream_id: station_stream.id)

        expect(measurements.pluck(:value)).to match_array([12.5, 15.0])
      end

      it 'copies daily averages to station_stream_daily_averages' do
        expect { subject.call }.to change(StationStreamDailyAverage, :count).by(1)
      end

      it 'copies daily average values correctly' do
        subject.call

        station_stream = StationStream.last
        averages =
          StationStreamDailyAverage.where(station_stream_id: station_stream.id)

        expect(averages.count).to eq(1)
        expect(averages.first.date).to eq(Date.new(2025, 1, 15))
        expect(averages.first.value).to eq(14)
      end

      it 'returns migration results' do
        result = subject.call

        expect(result[:migrated]).to eq(1)
        expect(result[:skipped]).to eq(0)
        expect(result[:measurements_copied]).to eq(2)
        expect(result[:daily_averages_copied]).to eq(1)
        expect(result[:unmatched]).to be_empty
        expect(result[:fake_refs]).to be_empty
        expect(result[:errors]).to be_empty
      end
    end

    context 'when migrating multiple streams in a batch' do
      let(:latitude1) { 40.123 }
      let(:longitude1) { -74.456 }
      let(:latitude2) { 41.789 }
      let(:longitude2) { -75.012 }

      let!(:session1) do
        create_epa_session(
          user: epa_user,
          latitude: latitude1,
          longitude: longitude1,
        )
      end
      let!(:session2) do
        create_epa_session(
          user: epa_user,
          latitude: latitude2,
          longitude: longitude2,
        )
      end
      let!(:stream1) do
        create(
          :stream,
          session: session1,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end
      let!(:stream2) do
        create(
          :stream,
          session: session2,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end
      let!(:measurement1) do
        create(:fixed_measurement, stream: stream1, value: 10.0)
      end
      let!(:measurement2) do
        create(:fixed_measurement, stream: stream2, value: 20.0)
      end
      let!(:daily_average1) do
        create(:stream_daily_average, stream: stream1, date: Date.new(2025, 1, 15), value: 10)
      end
      let!(:daily_average2) do
        create(:stream_daily_average, stream: stream2, date: Date.new(2025, 1, 15), value: 20)
      end

      let(:api_stations) do
        [
          GovernmentSources::Station.new(
            external_ref: 'STATION1',
            measurement_type: 'PM2.5',
            latitude: latitude1,
            longitude: longitude1,
            title: 'Station 1',
          ),
          GovernmentSources::Station.new(
            external_ref: 'STATION2',
            measurement_type: 'PM2.5',
            latitude: latitude2,
            longitude: longitude2,
            title: 'Station 2',
          ),
        ]
      end

      before { allow(data_parser).to receive(:call).and_return(api_stations) }

      it 'migrates all streams' do
        expect { subject.call }.to change(StationStream, :count).by(2)
      end

      it 'copies all measurements' do
        expect { subject.call }.to change(StationMeasurement, :count).by(2)
      end

      it 'copies all daily averages' do
        expect { subject.call }.to change(StationStreamDailyAverage, :count).by(2)
      end

      it 'returns correct migration count' do
        result = subject.call
        expect(result[:migrated]).to eq(2)
      end
    end

    context 'when streams are already migrated' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end
      let!(:existing_station_stream) do
        create(
          :station_stream,
          source: epa_source,
          stream_configuration: pm25_config,
          uuid: session.uuid,
          external_ref: 'EXISTING123',
        )
      end

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: latitude,
          longitude: longitude,
          title: 'Test Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'does not create duplicate StationStream' do
        expect { subject.call }.not_to change(StationStream, :count)
      end

      it 'returns skipped count' do
        result = subject.call
        expect(result[:skipped]).to eq(1)
        expect(result[:migrated]).to eq(0)
      end
    end

    context 'when stream has no matching AQSID in API data' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: 99.999,
          longitude: -99.999,
          title: 'Different Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'creates StationStream with a fake external ref' do
        expect { subject.call }.to change(StationStream, :count).by(1)

        station_stream = StationStream.last
        expect(station_stream.external_ref).to eq("UNMATCHED-#{session.uuid}")
      end

      it 'returns the stream in fake_refs list' do
        result = subject.call

        expect(result[:fake_refs].size).to eq(1)
        expect(result[:fake_refs].first[:stream_id]).to eq(stream.id)
        expect(result[:fake_refs].first[:sensor_name]).to eq('Government-PM2.5')
        expect(result[:unmatched]).to be_empty
      end
    end

    context 'when stream has unsupported sensor name' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-CO',
          threshold_set: pm25_threshold,
        )
      end

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: latitude,
          longitude: longitude,
          title: 'Test Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'does not create StationStream' do
        expect { subject.call }.not_to change(StationStream, :count)
      end

      it 'marks stream as unmatched' do
        result = subject.call
        expect(result[:unmatched].size).to eq(1)
      end
    end

    context 'when location matching uses rounded coordinates' do
      let(:latitude) { 40.1234567 }
      let(:longitude) { -74.4567890 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end
      let!(:measurement) { create(:fixed_measurement, stream: stream) }

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: 40.1231,
          longitude: -74.4569,
          title: 'Test Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'matches stations when coordinates round to same 3 decimal places' do
        expect { subject.call }.to change(StationStream, :count).by(1)
      end
    end

    context 'when matching different measurement types' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:no2_threshold) do
        create(
          :threshold_set,
          sensor_name: 'Government-NO2',
          unit_symbol: 'ppb',
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-NO2',
          threshold_set: no2_threshold,
        )
      end
      let!(:measurement) { create(:fixed_measurement, stream: stream) }

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'NO2STATION',
          measurement_type: 'NO2',
          latitude: latitude,
          longitude: longitude,
          title: 'NO2 Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'matches stream to station with same measurement type' do
        subject.call

        station_stream = StationStream.last
        expect(station_stream.stream_configuration_id).to eq(no2_config.id)
        expect(station_stream.external_ref).to eq('NO2STATION')
      end
    end

    context 'when stream has no measurements' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: latitude,
          longitude: longitude,
          title: 'Test Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'creates StationStream with nil timestamps' do
        subject.call

        station_stream = StationStream.last
        expect(station_stream.first_measured_at).to be_nil
        expect(station_stream.last_measured_at).to be_nil
      end

      it 'does not create any StationMeasurements' do
        expect { subject.call }.not_to change(StationMeasurement, :count)
      end

      it 'does not create any StationStreamDailyAverages' do
        expect { subject.call }.not_to change(StationStreamDailyAverage, :count)
      end
    end

    context 'idempotency - running migration twice' do
      let(:latitude) { 40.123 }
      let(:longitude) { -74.456 }

      let!(:session) do
        create_epa_session(
          user: epa_user,
          latitude: latitude,
          longitude: longitude,
        )
      end
      let!(:stream) do
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end
      let!(:measurement) do
        create(
          :fixed_measurement,
          stream: stream,
          value: 12.5,
          time_with_time_zone: Time.zone.parse('2025-01-15 10:00:00 UTC'),
        )
      end
      let!(:daily_average) do
        create(
          :stream_daily_average,
          stream: stream,
          date: Date.new(2025, 1, 15),
          value: 12,
        )
      end

      let(:api_station) do
        GovernmentSources::Station.new(
          external_ref: 'ABC123',
          measurement_type: 'PM2.5',
          latitude: latitude,
          longitude: longitude,
          title: 'Test Station',
        )
      end

      before { allow(data_parser).to receive(:call).and_return([api_station]) }

      it 'does not duplicate records on second run' do
        subject.call

        expect { subject.call }.not_to change(StationStream, :count)
        expect { subject.call }.not_to change(StationMeasurement, :count)
        expect { subject.call }.not_to change(StationStreamDailyAverage, :count)
      end

      it 'reports second run as skipped' do
        subject.call
        result = subject.call

        expect(result[:migrated]).to eq(0)
        expect(result[:skipped]).to eq(1)
      end
    end

    context 'when there are no streams to migrate' do
      it 'returns empty results' do
        result = subject.call

        expect(result[:migrated]).to eq(0)
        expect(result[:skipped]).to eq(0)
        expect(result[:measurements_copied]).to eq(0)
        expect(result[:daily_averages_copied]).to eq(0)
        expect(result[:unmatched]).to be_empty
        expect(result[:errors]).to be_empty
      end
    end

    context 'when streams belong to different users' do
      let(:other_user) { create(:user, username: 'Other User') }
      let!(:other_session) do
        create_epa_session(
          user: other_user,
          latitude: 40.123,
          longitude: -74.456,
        )
      end
      let!(:other_stream) do
        create(
          :stream,
          session: other_session,
          sensor_name: 'Government-PM2.5',
          threshold_set: pm25_threshold,
        )
      end

      it 'only migrates streams from US EPA AirNow user' do
        expect { subject.call }.not_to change(StationStream, :count)
      end
    end
  end

  describe 'batch processing efficiency' do
    let(:latitude_base) { 40.0 }
    let(:longitude_base) { -74.0 }

    before do
      stations = []

      5.times do |i|
        lat = (latitude_base + i * 0.001).round(3)
        lng = (longitude_base + i * 0.001).round(3)

        session =
          create_epa_session(user: epa_user, latitude: lat, longitude: lng)
        stream =
          create(
            :stream,
            session: session,
            sensor_name: 'Government-PM2.5',
            threshold_set: pm25_threshold,
          )
        create(:fixed_measurement, stream: stream, value: 10.0 + i)
        create(:stream_daily_average, stream: stream, date: Date.new(2025, 1, 15) + i, value: 10 + i)

        stations <<
          GovernmentSources::Station.new(
            external_ref: "STATION#{i}",
            measurement_type: 'PM2.5',
            latitude: lat,
            longitude: lng,
            title: "Station #{i}",
          )
      end

      allow(data_parser).to receive(:call).and_return(stations)
    end

    it 'migrates all streams in batch' do
      result = subject.call

      expect(result[:migrated]).to eq(5)
      expect(StationStream.count).to eq(5)
      expect(StationMeasurement.count).to eq(5)
      expect(StationStreamDailyAverage.count).to eq(5)
    end

    it 'uses batch queries for bounds' do
      expect(FixedMeasurement).to receive(:where).once.and_call_original

      subject.call
    end
  end
end
