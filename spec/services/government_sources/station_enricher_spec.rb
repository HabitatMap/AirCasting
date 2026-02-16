require 'rails_helper'

describe GovernmentSources::StationEnricher do
  subject { described_class.new }

  describe '#call' do
    it 'returns empty array when given empty stations' do
      result = subject.call(stations: [], source_name: :epa)

      expect(result).to eq([])
    end

    it 'enriches stations with location, time_zone, source_id, stream_configuration_id, and url_token' do
      source = create(:source, name: 'EPA')
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

      pm25_station = build_station(measurement_type: 'PM2.5')
      ozone_station =
        build_station(
          measurement_type: 'Ozone',
          latitude: 51.5074,
          longitude: -0.1278,
        )

      result =
        subject.call(stations: [pm25_station, ozone_station], source_name: :epa)

      expect(result[0].location.latitude).to eq(40.7128)
      expect(result[0].location.longitude).to eq(-74.006)
      expect(result[0].time_zone).to eq('America/New_York')
      expect(result[0].source_id).to eq(source.id)
      expect(result[0].stream_configuration_id).to eq(pm25_config.id)
      expect(result[0].url_token).to be_present

      expect(result[1].stream_configuration_id).to eq(ozone_config.id)
    end
  end

  private

  def build_station(overrides = {})
    GovernmentSources::Station.new(
      {
        external_ref: 'REF123',
        measurement_type: 'PM2.5',
        latitude: 40.7128,
        longitude: -74.006,
        title: 'Test Station',
      }.merge(overrides),
    )
  end
end
