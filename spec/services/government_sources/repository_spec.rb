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
      create(
        :station_stream,
        source: source,
        stream_configuration: stream_config,
        url_token: 'abc123',
      )

      expect(subject.station_stream_url_token_available?('abc123')).to be false
    end

    it 'returns true when token does not exist' do
      expect(
        subject.station_stream_url_token_available?('nonexistent'),
      ).to be true
    end
  end

  describe '#bulk_update_stream_timestamps' do
    it 'sets first_measured_at and last_measured_at when they are null' do
      stream = create(:station_stream)
      t1 = Time.parse('2025-01-01 08:00:00 UTC')
      t2 = Time.parse('2025-01-01 20:00:00 UTC')

      subject.bulk_update_stream_timestamps(
        bounds_by_stream: {
          stream.id => {
            min: t1,
            max: t2,
          },
        },
      )

      stream.reload
      expect(stream.first_measured_at).to eq(t1)
      expect(stream.last_measured_at).to eq(t2)
    end

    it 'extends the range when new bounds are wider' do
      t1 = Time.parse('2025-01-01 08:00:00 UTC')
      t2 = Time.parse('2025-01-01 12:00:00 UTC')
      t3 = Time.parse('2025-01-01 16:00:00 UTC')
      t4 = Time.parse('2025-01-01 20:00:00 UTC')
      stream =
        create(:station_stream, first_measured_at: t2, last_measured_at: t3)

      subject.bulk_update_stream_timestamps(
        bounds_by_stream: {
          stream.id => {
            min: t1,
            max: t4,
          },
        },
      )

      stream.reload
      expect(stream.first_measured_at).to eq(t1)
      expect(stream.last_measured_at).to eq(t4)
    end

    it 'does not shrink the range when new bounds are narrower' do
      t1 = Time.parse('2025-01-01 08:00:00 UTC')
      t2 = Time.parse('2025-01-01 12:00:00 UTC')
      t3 = Time.parse('2025-01-01 16:00:00 UTC')
      t4 = Time.parse('2025-01-01 20:00:00 UTC')
      stream =
        create(:station_stream, first_measured_at: t1, last_measured_at: t4)

      subject.bulk_update_stream_timestamps(
        bounds_by_stream: {
          stream.id => {
            min: t2,
            max: t3,
          },
        },
      )

      stream.reload
      expect(stream.first_measured_at).to eq(t1)
      expect(stream.last_measured_at).to eq(t4)
    end

    it 'updates multiple streams in one call' do
      stream_configuration = create(:stream_configuration)
      stream_1 =
        create(:station_stream, stream_configuration: stream_configuration)
      stream_2 =
        create(:station_stream, stream_configuration: stream_configuration)
      t1 = Time.parse('2025-01-01 08:00:00 UTC')
      t2 = Time.parse('2025-01-01 20:00:00 UTC')
      t3 = Time.parse('2025-02-01 06:00:00 UTC')
      t4 = Time.parse('2025-02-01 18:00:00 UTC')

      subject.bulk_update_stream_timestamps(
        bounds_by_stream: {
          stream_1.id => {
            min: t1,
            max: t2,
          },
          stream_2.id => {
            min: t3,
            max: t4,
          },
        },
      )

      stream_1.reload
      expect(stream_1.first_measured_at).to eq(t1)
      expect(stream_1.last_measured_at).to eq(t2)

      stream_2.reload
      expect(stream_2.first_measured_at).to eq(t3)
      expect(stream_2.last_measured_at).to eq(t4)
    end

    it 'does nothing when bounds_by_stream is empty' do
      stream = create(:station_stream)

      expect {
        subject.bulk_update_stream_timestamps(bounds_by_stream: {})
      }.not_to change { stream.reload.updated_at }
    end
  end

  describe '#upsert_station_measurements' do
    it 'creates new station measurements' do
      station_stream = create(:station_stream)

      records = [
        {
          station_stream_id: station_stream.id,
          measured_at: Time.parse('2025-07-24 10:00:00 UTC'),
          value: 12.5,
          created_at: Time.current,
          updated_at: Time.current,
        },
      ]

      expect {
        subject.upsert_station_measurements(records: records)
      }.to change(StationMeasurement, :count).by(1)
    end

    it 'updates value on conflict' do
      station_stream = create(:station_stream)
      measured_at = Time.parse('2025-07-24 10:00:00 UTC')
      create(
        :station_measurement,
        station_stream: station_stream,
        measured_at: measured_at,
        value: 10.0,
      )

      records = [
        {
          station_stream_id: station_stream.id,
          measured_at: measured_at,
          value: 15.0,
          created_at: Time.current,
          updated_at: Time.current,
        },
      ]

      expect {
        subject.upsert_station_measurements(records: records)
      }.not_to change(StationMeasurement, :count)
      expect(StationMeasurement.last.value).to eq(15.0)
    end

    it 'does nothing when records is empty' do
      expect { subject.upsert_station_measurements(records: []) }.not_to change(
        StationMeasurement,
        :count,
      )
    end
  end

  describe '#recently_updated_station_streams' do
    it 'returns streams updated within the given window' do
      stream = create(:station_stream)

      result = subject.recently_updated_station_streams(since: 1.hour.ago)

      expect(result).to include(stream)
    end
  end

  describe '#upsert_station_stream_daily_averages' do
    it 'creates a daily average from measurements in the window' do
      stream = create(:station_stream, time_zone: 'UTC')
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 08:00:00 UTC'),
        value: 10,
      )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 16:00:00 UTC'),
        value: 20,
      )

      expect {
        subject.upsert_station_stream_daily_averages(
          stream_ids: [stream.id],
          time_zone: 'UTC',
          since: Time.parse('2026-01-15 00:00:00 UTC'),
        )
      }.to change(StationStreamDailyAverage, :count).by(1)

      average = StationStreamDailyAverage.last
      expect(average.date).to eq(Date.parse('2026-01-15'))
      expect(average.value).to eq(15)
    end

    it 'groups measurements by day using the interval: (00:00:00 D, 00:00:00 D+1]' do
      stream = create(:station_stream, time_zone: 'UTC')
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 00:00:00 UTC'),
        value: 10,
      )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 00:00:01 UTC'),
        value: 20,
      )

      subject.upsert_station_stream_daily_averages(
        stream_ids: [stream.id],
        time_zone: 'UTC',
        since: Time.parse('2026-01-14 00:00:00 UTC'),
      )

      expect(
        StationStreamDailyAverage.find_by(date: Date.parse('2026-01-14')).value,
      ).to eq(10)
      expect(
        StationStreamDailyAverage.find_by(date: Date.parse('2026-01-15')).value,
      ).to eq(20)
    end

    it 'defines day boundries based on station stream time zone' do
      stream = create(:station_stream, time_zone: 'America/New_York')
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 05:00:00 -0500'),
        value: 10,
      )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 23:00:00 -0500'), # Jan 16 in UTC
        value: 20,
      )

      subject.upsert_station_stream_daily_averages(
        stream_ids: [stream.id],
        time_zone: 'America/New_York',
        since: Time.parse('2026-01-15 00:00:00 -0500'),
      )

      expect(StationStreamDailyAverage.count).to eq(1)
      expect(StationStreamDailyAverage.last.date).to eq(
        Date.parse('2026-01-15'),
      )
      expect(StationStreamDailyAverage.last.value).to eq(15)
    end

    it 'updates the existing record on conflict' do
      stream = create(:station_stream, time_zone: 'UTC')
      existing =
        create(
          :station_stream_daily_average,
          station_stream: stream,
          date: Date.parse('2026-01-15'),
          value: 5,
        )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 12:00:00 UTC'),
        value: 30,
      )

      expect {
        subject.upsert_station_stream_daily_averages(
          stream_ids: [stream.id],
          time_zone: 'UTC',
          since: Time.parse('2026-01-15 00:00:00 UTC'),
        )
      }.not_to change(StationStreamDailyAverage, :count)

      expect(existing.reload.value).to eq(30)
    end

    it 'rounds the average value to the nearest integer' do
      stream = create(:station_stream, time_zone: 'UTC')
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 08:00:00 UTC'),
        value: 10,
      )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 12:00:00 UTC'),
        value: 11,
      )
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 16:00:00 UTC'),
        value: 11,
      )

      subject.upsert_station_stream_daily_averages(
        stream_ids: [stream.id],
        time_zone: 'UTC',
        since: Time.parse('2026-01-15 00:00:00 UTC'),
      )

      # avg = 10.67, rounds to 11
      expect(StationStreamDailyAverage.last.value).to eq(11)
    end

    it 'does nothing when stream_ids is empty' do
      expect {
        subject.upsert_station_stream_daily_averages(
          stream_ids: [],
          time_zone: 'UTC',
          since: 3.days.ago.utc,
        )
      }.not_to change(StationStreamDailyAverage, :count)
    end

    it 'normalizes since to beginning of day in the given time zone' do
      stream = create(:station_stream, time_zone: 'America/New_York')
      create(
        :station_measurement,
        station_stream: stream,
        measured_at: Time.parse('2026-01-15 02:00:00 -0500'),
        value: 10,
      )

      # 2026-01-15 00:00:00 UTC = 2026-01-14 19:00:00 New York
      # The repository should normalize to Jan 14 local midnight, so the Jan 15
      # measurement is included and counted under Jan 15
      subject.upsert_station_stream_daily_averages(
        stream_ids: [stream.id],
        time_zone: 'America/New_York',
        since: Time.parse('2026-01-15 00:00:00 UTC'),
      )

      expect(StationStreamDailyAverage.count).to eq(1)
      expect(StationStreamDailyAverage.last.date).to eq(Date.parse('2026-01-15'))
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

      expect { subject.upsert_station_streams(records: records) }.to change(
        StationStream,
        :count,
      ).by(1)
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

      expect { subject.upsert_station_streams(records: records) }.not_to change(
        StationStream,
        :count,
      )
      expect(StationStream.last.title).to eq('New Title')
    end
  end
end
