require 'rails_helper'

describe GovernmentSources::StationsUpserter do
  let!(:source) { create(:source, name: 'EPA') }
  let(:time_zone_finder) { double(time_zone_at: 'America/New_York') }

  subject { described_class.new(time_zone_finder: time_zone_finder) }

  describe '#call' do
    it 'returns empty array when given empty stations' do
      expect(subject.call(stations: [], source_name: :epa)).to eq([])
    end

    it 'creates one station per site and hands it to every stream of the site' do
      pm25 = build_row(external_ref: 'SID1', measurement_type: 'PM2.5')
      ozone = build_row(external_ref: 'SID1', measurement_type: 'Ozone')

      expect {
        subject.call(stations: [pm25, ozone], source_name: :epa)
      }.to change(Station, :count).by(1)

      station = Station.last
      expect(station).to have_attributes(
        source_id: source.id,
        external_ref: 'FULL1',
        title: 'Site',
        time_zone: 'America/New_York',
        excluded_reason: nil,
      )
      expect(station.location.y).to eq(27.5)
      expect(station.location.x).to eq(-80.25)

      [pm25, ozone].each do |row|
        expect(row.station_id).to eq(station.id)
        expect(row.source_id).to eq(source.id)
        expect(row.time_zone).to eq('America/New_York')
        expect(row.location.y).to eq(27.5)
      end
    end

    it 'stores the excluded reason' do
      row =
        build_row(excluded_reason: Station::EXCLUDED_REASONS[:temporary])

      subject.call(stations: [row], source_name: :epa)

      expect(Station.last.excluded_reason).to eq('temporary')
    end

    it 'keeps the stored time zone when the point did not move' do
      create(
        :station,
        source: source,
        external_ref: 'FULL1',
        location: 'SRID=4326;POINT(-80.25 27.5)',
        time_zone: 'America/Chicago',
      )
      row = build_row

      subject.call(stations: [row], source_name: :epa)

      expect(time_zone_finder).not_to have_received(:time_zone_at)
      expect(row.time_zone).to eq('America/Chicago')
    end

    it 'moves the station and looks the time zone up again when the point changed' do
      station =
        create(
          :station,
          source: source,
          external_ref: 'FULL1',
          location: 'SRID=4326;POINT(0 0)',
          time_zone: 'UTC',
        )

      subject.call(stations: [build_row], source_name: :epa)

      station.reload
      expect(time_zone_finder).to have_received(:time_zone_at).with(
        lat: 27.5,
        lng: -80.25,
      )
      expect(station.time_zone).to eq('America/New_York')
      expect(station.location.x).to eq(-80.25)
    end

    it 'falls back to UTC where the point has no time zone' do
      allow(time_zone_finder).to receive(:time_zone_at).and_return(nil)

      subject.call(stations: [build_row(latitude: 50.0, longitude: -150.0)], source_name: :epa)

      expect(Station.last.time_zone).to eq('UTC')
    end

    it 'does not write a station that did not change' do
      station =
        create(
          :station,
          source: source,
          external_ref: 'FULL1',
          title: 'Site',
          location: 'SRID=4326;POINT(-80.25 27.5)',
          time_zone: 'America/New_York',
          updated_at: 2.days.ago,
        )

      subject.call(stations: [build_row], source_name: :epa)

      expect(station.reload.updated_at).to be < 1.day.ago
    end
  end

  private

  def build_row(overrides = {})
    GovernmentSources::Station.new(
      {
        external_ref: 'SID1',
        station_external_ref: 'FULL1',
        measurement_type: 'PM2.5',
        latitude: 27.5,
        longitude: -80.25,
        title: 'Site',
      }.merge(overrides),
    )
  end
end
