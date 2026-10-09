require 'rails_helper'

describe Epa::Stations::Interactor do
  let!(:source) { create(:source, name: 'EPA') }
  let!(:pm25_config) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let!(:ozone_config) do
    create(:stream_configuration, measurement_type: 'Ozone', canonical: true)
  end
  let!(:no2_config) do
    create(:stream_configuration, measurement_type: 'NO2', canonical: true)
  end
  let(:api_client) do
    instance_double(
      Epa::ApiClient,
      fetch_locations: file_fixture('epa_locations_v2_sample.dat').read,
    )
  end
  let(:time_zone_finder) { double(time_zone_at: 'America/Los_Angeles') }
  let(:rebuilder) { class_double(RebuildStationStreamDailyAveragesWorker, perform_async: nil) }

  subject do
    described_class.new(
      api_client: api_client,
      stations_upserter:
        GovernmentSources::StationsUpserter.new(time_zone_finder: time_zone_finder),
      station_streams_updater:
        GovernmentSources::StationStreamsUpdater.new(daily_averages_rebuilder: rebuilder),
      station_enricher:
        GovernmentSources::StationEnricher.new(time_zone_finder: time_zone_finder),
    )
  end

  it 'groups the streams of a site under one station' do
    subject.call

    livermore = Station.find_by!(external_ref: '840060010007')
    expect(livermore.station_streams.map(&:external_ref).uniq).to eq(['060010007'])
    expect(livermore.station_streams.count).to eq(3)
    expect(StationStream.where(station_id: nil)).to be_empty
  end

  it 'flags temporary monitors and creates nothing at 0,0 or 90,0' do
    subject.call

    expect(Station.find_by!(external_ref: '840TT1234567').excluded_reason).to eq('temporary')
    expect(StationStream.where(external_ref: %w[070000000000 080000000000])).to be_empty
  end

  it 'updates an existing stream in place, keeping its url_token' do
    stream =
      create(
        :station_stream,
        source: source,
        stream_configuration: pm25_config,
        external_ref: '060010009',
        location: 'SRID=4326;POINT(0 0)',
        time_zone: 'UTC',
        url_token: 'keepme',
      )

    expect { subject.call }.not_to change { StationStream.where(external_ref: '060010009').count }

    stream.reload
    expect(stream.station.external_ref).to eq('840060010009')
    expect(stream.location.y).to eq(37.123456)
    expect(stream.time_zone).to eq('America/Los_Angeles')
    expect(stream.url_token).to eq('keepme')
    expect(rebuilder).to have_received(:perform_async).with([stream.id])
  end

  it 'is a no-op the second time' do
    subject.call

    expect { subject.call }.not_to change {
      [StationStream.maximum(:updated_at), Station.maximum(:updated_at), StationStream.count]
    }
  end
end
