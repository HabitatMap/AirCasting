require 'rails_helper'

describe GovernmentSources::StationStreamsUpdater do
  let!(:source) { create(:source, name: 'EPA') }
  let(:stream_configuration) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let(:station) { create(:station, source: source) }
  let(:rebuilder) { class_double(RebuildStationStreamDailyAveragesWorker, perform_async: nil) }
  let(:logger) { instance_double(Logger, warn: nil) }

  subject { described_class.new(daily_averages_rebuilder: rebuilder, logger: logger) }

  describe '#call' do
    it 'sets station, point and time zone, and leaves the url_token alone' do
      stream =
        create_stream(location: 'SRID=4326;POINT(-80.2501 27.5001)', url_token: 'keepme')

      subject.call(stations: [build_row], source_name: :epa)

      stream.reload
      expect(stream.station_id).to eq(station.id)
      expect(stream.location.x).to eq(-80.25)
      expect(stream.location.y).to eq(27.5)
      expect(stream.url_token).to eq('keepme')
      expect(rebuilder).not_to have_received(:perform_async)
      expect(logger).not_to have_received(:warn)
    end

    it 'does not write a stream that did not change' do
      stream = create_stream(station: station, updated_at: 2.days.ago)

      subject.call(stations: [build_row], source_name: :epa)

      expect(stream.reload.updated_at).to be < 1.day.ago
    end

    it 'ignores rows with no existing stream' do
      expect {
        subject.call(stations: [build_row(external_ref: 'NEW')], source_name: :epa)
      }.not_to change { StationStream.maximum(:updated_at) }
    end

    it 'queues a daily-average rebuild for streams whose time zone changed' do
      rezoned = create_stream(time_zone: 'UTC')

      subject.call(stations: [build_row], source_name: :epa)

      expect(rebuilder).to have_received(:perform_async).with([rezoned.id])
    end

    it 'logs a move over 1 km' do
      create_stream(location: 'SRID=4326;POINT(0 0)')

      subject.call(stations: [build_row], source_name: :epa)

      expect(logger).to have_received(:warn).with(/moved .* km/)
    end
  end

  private

  def create_stream(overrides = {})
    create(
      :station_stream,
      {
        source: source,
        stream_configuration: stream_configuration,
        external_ref: 'SID1',
        location: 'SRID=4326;POINT(-80.25 27.5)',
        time_zone: 'America/New_York',
      }.merge(overrides),
    )
  end

  def build_row(overrides = {})
    GovernmentSources::Station.new(
      {
        external_ref: 'SID1',
        station_external_ref: 'FULL1',
        measurement_type: 'PM2.5',
        latitude: 27.5,
        longitude: -80.25,
        location: RGeo::Geographic.spherical_factory(srid: 4326).point(-80.25, 27.5),
        time_zone: 'America/New_York',
        station_id: station.id,
      }.merge(overrides),
    )
  end
end
