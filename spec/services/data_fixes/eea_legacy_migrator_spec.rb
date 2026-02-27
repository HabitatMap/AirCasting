require 'rails_helper'

RSpec.describe DataFixes::EeaLegacyMigrator do
  subject { described_class.new }

  it 'creates a StationStream with attributes from the fixed stream and copies measurements' do
    eea_source = create(:source, name: 'EEA')
    pm25_config =
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
    legacy_stream = create(:stream)
    fixed_stream =
      create(
        :fixed_stream,
        source: eea_source,
        stream_configuration: pm25_config,
        external_ref: 'EEA-STATION-001',
        title: 'Warsaw PM2.5',
        time_zone: 'Europe/Warsaw',
        first_measured_at: Time.parse('2025-01-15 10:00:00 UTC'),
        last_measured_at: Time.parse('2025-01-15 11:00:00 UTC'),
        stream: legacy_stream,
      )

    measurement1 =
      create(
        :fixed_measurement,
        stream: legacy_stream,
        fixed_stream_id: fixed_stream.id,
        value: 12.5,
        time_with_time_zone: Time.parse('2025-01-15 10:00:00 UTC'),
        measured_at: Time.parse('2025-01-15 10:00:00 UTC'),
      )
    measurement2 =
      create(
        :fixed_measurement,
        stream: legacy_stream,
        fixed_stream_id: fixed_stream.id,
        value: 15.0,
        time_with_time_zone: Time.parse('2025-01-15 11:00:00 UTC'),
        measured_at: Time.parse('2025-01-15 11:00:00 UTC'),
      )

    subject.call

    station_stream = StationStream.last
    expect(station_stream.source_id).to eq(eea_source.id)
    expect(station_stream.stream_configuration_id).to eq(pm25_config.id)
    expect(station_stream.external_ref).to eq('EEA-STATION-001')
    expect(station_stream.time_zone).to eq('Europe/Warsaw')
    expect(station_stream.title).to eq('Warsaw PM2.5')
    expect(station_stream.url_token).to eq(fixed_stream.url_token)
    expect(station_stream.first_measured_at).to eq(
      Time.parse('2025-01-15 10:00:00 UTC'),
    )
    expect(station_stream.last_measured_at).to eq(
      Time.parse('2025-01-15 11:00:00 UTC'),
    )

    measurements =
      StationMeasurement.where(station_stream_id: station_stream.id)
    expect(measurements.pluck(:value)).to match_array([12.5, 15.0])
    expect(measurements.pluck(:measured_at)).to match_array(
      [
        Time.parse('2025-01-15 10:00:00 UTC'),
        Time.parse('2025-01-15 11:00:00 UTC'),
      ],
    )
  end

  it 'skips already-migrated streams and reports the count' do
    eea_source = create(:source, name: 'EEA')
    pm25_config =
      create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
    legacy_stream = create(:stream)
    fixed_stream =
      create(
        :fixed_stream,
        source: eea_source,
        stream_configuration: pm25_config,
        external_ref: 'EEA-STATION-001',
        title: 'Warsaw PM2.5',
        time_zone: 'Europe/Warsaw',
        first_measured_at: Time.parse('2025-01-15 10:00:00 UTC'),
        last_measured_at: Time.parse('2025-01-15 11:00:00 UTC'),
        stream: legacy_stream,
      )

    create(
      :station_stream,
      source: eea_source,
      stream_configuration: pm25_config,
      external_ref: 'EEA-STATION-001',
    )

    result = subject.call

    expect(StationStream.count).to eq(1)
    expect(result[:skipped]).to eq(1)
    expect(result[:migrated]).to eq(0)
  end
end
