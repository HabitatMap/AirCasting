require 'rails_helper'

describe DataFixes::EpaStationlessStreamsLinker do
  let!(:source) { create(:source, name: 'EPA') }
  let!(:pm25) do
    create(:stream_configuration, measurement_type: 'PM2.5', canonical: true)
  end
  let(:last_measured_at) { Time.utc(2024, 6, 26, 20) }
  let(:site_list) { v2_line('530330010', '840530330010', 47.5617, -122.0644) }
  let(:api_client) { instance_double(Epa::ApiClient) }
  let(:stations_upserter) do
    GovernmentSources::StationsUpserter.new(
      time_zone_finder: double(time_zone_at: 'America/Los_Angeles'),
    )
  end
  let(:logger) { instance_double(Logger, info: nil) }

  subject do
    described_class.new(
      api_client: api_client,
      stations_upserter: stations_upserter,
      logger: logger,
    )
  end

  before do
    allow(api_client).to receive(:fetch_locations_on) { site_list }
    allow(api_client).to receive(:fetch_v1_locations_on) { '' }
  end

  describe '#call' do
    it 'reads the site list of the day the stream last reported' do
      create_stream(external_ref: '530330010')

      subject.call(apply: true)

      expect(api_client).to have_received(:fetch_locations_on)
        .with(date: Date.new(2024, 6, 26)).once
    end

    it 'links a stream to the station of its ref' do
      station = create(:station, source: source, external_ref: '840530330010')
      stream = create_stream(external_ref: '530330010')

      subject.call(apply: true)

      expect(stream.reload.station_id).to eq(station.id)
    end

    it 'creates a station missing from stations from that day\'s row' do
      stream = create_stream(external_ref: '530330010')

      subject.call(apply: true)

      station = stream.reload.station
      expect(station.external_ref).to eq('840530330010')
      expect(station.title).to eq('Issaquah')
      expect(station.time_zone).to eq('America/Los_Angeles')
    end

    it 'gives an UNMATCHED stream the ref at its rounded point and links it' do
      stream = create_stream(external_ref: 'UNMATCHED-1', location: point(47.5621, -122.0641))

      counts = subject.call(apply: true)

      stream.reload
      expect(stream.external_ref).to eq('530330010')
      expect(stream.station.external_ref).to eq('840530330010')
      expect(counts[:rekey]).to eq(1)
    end

    it 'replaces a stream for that ref that never measured anything' do
      twin = create_stream(external_ref: '530330010', last_measured_at: nil)
      stream = create_stream(external_ref: 'UNMATCHED-1', location: point(47.562, -122.064))

      subject.call(apply: true)

      expect(StationStream.exists?(twin.id)).to be(false)
      expect(stream.reload.external_ref).to eq('530330010')
    end

    it 'only links an UNMATCHED stream when the stream for that ref has data' do
      station = create(:station, source: source, external_ref: '840530330010')
      twin = create_stream(external_ref: '530330010', station: station)
      create(:station_measurement, station_stream: twin)
      stream = create_stream(external_ref: 'UNMATCHED-1', location: point(47.562, -122.064))

      counts = subject.call(apply: true)

      stream.reload
      expect(stream.external_ref).to eq('UNMATCHED-1')
      expect(stream.station_id).to eq(station.id)
      expect(StationStream.exists?(twin.id)).to be(true)
      expect(counts[:link_twin_has_data]).to eq(1)
    end

    it 'gives a ref to one UNMATCHED stream only when two match it' do
      first = create_stream(external_ref: 'UNMATCHED-1', location: point(47.562, -122.064))
      second = create_stream(external_ref: 'UNMATCHED-2', location: point(47.562, -122.064))

      subject.call(apply: true)

      expect([first, second].map { |s| s.reload.external_ref })
        .to contain_exactly('530330010', 'UNMATCHED-2')
      expect(second.station_id).to eq(first.station_id)
    end

    context 'when sites of two stations share the rounded point' do
      let(:site_list) do
        v2_line('530330010', '840530330010', 47.5617, -122.0644) +
          v2_line('530330099', '840530330099', 47.5621, -122.0641)
      end

      it 'leaves the UNMATCHED stream alone' do
        stream = create_stream(external_ref: 'UNMATCHED-1', location: point(47.562, -122.064))

        counts = subject.call(apply: true)

        expect(stream.reload.station_id).to be_nil
        expect(counts[:ambiguous]).to eq(1)
      end
    end

    context 'when that day no longer lists the stream\'s row' do
      before do
        allow(api_client).to receive(:fetch_locations_on)
          .with(date: Date.new(2024, 6, 26))
          .and_return(v2_line('530330099', '840530330099', 47.6, -122.1))
      end

      it 'links it by the previous day\'s list' do
        stream = create_stream(external_ref: '530330010')

        counts = subject.call(apply: true)

        expect(stream.reload.station.external_ref).to eq('840530330010')
        expect(counts[:link]).to eq(1)
        expect(api_client).to have_received(:fetch_locations_on)
          .with(date: Date.new(2024, 6, 25))
      end

      it 'leaves it alone when the previous day does not list it either' do
        allow(api_client).to receive(:fetch_locations_on)
          .with(date: Date.new(2024, 6, 25))
          .and_return(v2_line('530330099', '840530330099', 47.6, -122.1))
        stream = create_stream(external_ref: '530330010')

        counts = subject.call(apply: true)

        expect(stream.reload.station_id).to be_nil
        expect(counts[:no_match]).to eq(1)
      end
    end

    it 'leaves streams with no match alone' do
      stream = create_stream(external_ref: 'UNMATCHED-1', location: point(40.0, -100.0))

      counts = subject.call(apply: true)

      expect(stream.reload.station_id).to be_nil
      expect(counts[:no_match]).to eq(1)
    end

    context 'when that day\'s list does not resolve an UNMATCHED stream' do
      let(:session_uuid) { '0b658cd2-b2ba-4f25-8fed-d4df34788362' }
      let!(:stream) do
        create_stream(
          external_ref: "UNMATCHED-#{session_uuid}",
          location: point(40.0, -100.0),
        )
      end
      let(:last_fed_day) { Date.new(2025, 3, 10) }
      let(:created_day) { Date.new(2024, 4, 24) }

      before do
        create(
          :fixed_session,
          uuid: session_uuid,
          latitude: 47.562,
          longitude: -122.064,
          created_at: Time.utc(2024, 4, 24, 16, 56),
          last_measurement_at: Time.utc(2025, 3, 10, 13),
        )
      end

      it 'takes the AQSID the v1 list of the day its legacy session was last fed holds at the session\'s point' do
        allow(api_client).to receive(:fetch_v1_locations_on)
          .with(date: last_fed_day)
          .and_return(v1_line('530330010', 47.5617, -122.0644))

        counts = subject.call(apply: true)

        stream.reload
        expect(stream.external_ref).to eq('530330010')
        expect(stream.station.external_ref).to eq('840530330010')
        expect(counts[:rekey]).to eq(1)
        expect(api_client).to have_received(:fetch_locations_on).with(date: last_fed_day)
      end

      it 'falls back to the v1 list of the day the session was created' do
        allow(api_client).to receive(:fetch_v1_locations_on)
          .with(date: created_day)
          .and_return(v1_line('530330010', 47.5617, -122.0644))

        subject.call(apply: true)

        expect(stream.reload.external_ref).to eq('530330010')
      end

      it 'keys an AQSID by its first v1 row, as the legacy import does' do
        allow(api_client).to receive(:fetch_v1_locations_on)
          .with(date: last_fed_day)
          .and_return(
            v1_line('530330010', 47.6, -122.1, parameter: 'OZONE') +
              v1_line('530330010', 47.5617, -122.0644),
          )

        counts = subject.call(apply: true)

        expect(stream.reload.station_id).to be_nil
        expect(counts[:no_match]).to eq(1)
      end

      it 'leaves it alone when that day lists two AQSIDs at the point' do
        allow(api_client).to receive(:fetch_v1_locations_on)
          .with(date: last_fed_day)
          .and_return(
            v1_line('530330010', 47.5617, -122.0644) +
              v1_line('530330099', 47.5621, -122.0641),
          )
        allow(api_client).to receive(:fetch_v1_locations_on)
          .with(date: created_day)
          .and_return(v1_line('530330010', 47.5617, -122.0644))

        counts = subject.call(apply: true)

        expect(stream.reload.station_id).to be_nil
        expect(counts[:no_match]).to eq(1)
      end
    end

    it 'leaves streams alone when that day has no site list' do
      allow(api_client).to receive(:fetch_locations_on)
        .and_raise(ApiClient::RequestError, 'GET failed with status 404')
      stream = create_stream(external_ref: '530330010')

      counts = subject.call(apply: true)

      expect(stream.reload.station_id).to be_nil
      expect(counts[:no_site_list]).to eq(1)
    end

    it 'leaves hand-checked refs to the merger' do
      allow(api_client).to receive(:fetch_locations_on)
        .and_return(v2_line('840530330090', '840530330090', 47.4, -122.3))
      stream = create_stream(external_ref: '840530330090')

      counts = subject.call(apply: true)

      expect(stream.reload.station_id).to be_nil
      expect(Station.count).to eq(0)
      expect(counts[:hand_checked]).to eq(1)
    end

    it 'skips streams that never measured anything' do
      create_stream(external_ref: '530330010', last_measured_at: nil)

      counts = subject.call(apply: true)

      expect(api_client).not_to have_received(:fetch_locations_on)
      expect(counts[:never_measured]).to eq(1)
    end

    it 'writes nothing on a dry run' do
      twin = create_stream(external_ref: '530330010', last_measured_at: nil)
      stream = create_stream(external_ref: 'UNMATCHED-1', location: point(47.562, -122.064))

      counts = subject.call

      expect(stream.reload.external_ref).to eq('UNMATCHED-1')
      expect(stream.station_id).to be_nil
      expect(StationStream.exists?(twin.id)).to be(true)
      expect(Station.count).to eq(0)
      expect(counts[:rekey_replacing_twin]).to eq(1)
    end
  end

  def create_stream(**attributes)
    create(
      :station_stream,
      source: source,
      stream_configuration: pm25,
      location: point(47.5617, -122.0644),
      first_measured_at: last_measured_at && last_measured_at - 1.day,
      last_measured_at: last_measured_at,
      **attributes,
    ).tap do |stream|
      stream.update_columns(first_measured_at: nil) if stream.last_measured_at.nil?
    end
  end

  def point(latitude, longitude)
    "SRID=4326;POINT(#{longitude} #{latitude})"
  end

  def v1_line(aqsid, latitude, longitude, parameter: 'PM2.5')
    [
      aqsid, parameter, '0010', 'Issaquah', 'Active', 'WA1', 'Washington', 'R10',
      latitude, longitude, '', '-8.00', 'US'
    ].join('|') + "\n"
  end

  def v2_line(station_id, full_aqsid, latitude, longitude)
    [
      station_id, station_id, full_aqsid, 'PM2.5', 'Permanent', '0010',
      'Issaquah', 'Active', 'WA1', 'Washington', 'R10', latitude, longitude,
      '', '-8.00', 'US', '', '', '', '', '', ''
    ].join('|') + "\n"
  end
end
