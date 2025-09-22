require 'rails_helper'

RSpec.describe AirNowStreaming::Interactor do
  describe '#call' do
    it 'processes data and updates or creates streams and sessions' do
      user = create(:user, username: 'US EPA AirNow')
      threshold_set_pm25 =
        create(:threshold_set, sensor_name: 'Government-PM2.5')
      session =
        create(
          :fixed_session,
          latitude: 46.386,
          longitude: -62.583,
          time_zone: 'America/Halifax',
          start_time_local: Time.zone.parse('2025-07-24 05:00:00'),
          end_time_local: Time.zone.parse('2025-07-24 06:00:00'),
          last_measurement_at: Time.zone.parse('2025-07-24 09:00:00'),
          user: user,
        )
      stream =
        create(
          :stream,
          session: session,
          sensor_name: 'Government-PM2.5',
          threshold_set: threshold_set_pm25,
        )

      locations_data =
        "000020401|PM2.5|0401|SOUTHAMPTON|Active|PE1|Canada-Prince Edward Island1|CA|46.386400|-62.582800|15.300|-4.00|CA|||||00|CC|002|PRINCE EDWARD ISLAND||\n" +
          "000030113|PM2.5|0113|JOHNSTON BUILDING|Active|NS1|Canada-Nova Scotia1|CA|44.647175|-63.573689|29.000|-4.00|CA|||||00|CC|003|NOVA SCOTIA||\n"

      measurements_data =
        "07/24/25|09:00|000020401|SOUTHAMPTON|-4|PM2.5|UG/M3|5.3|Canada-Prince Edward Island1\n" +
          "07/24/25|09:00|000030113|JOHNSTON BUILDING|-4|PM2.5|UG/M3|4.2|Canada-Nova Scotia1\n" +
          "07/24/25|10:00|000030113|JOHNSTON BUILDING|-4|PM2.5|UG/M3|5.2|Canada-Nova Scotia1\n"

      data_importer = instance_double(AirNowStreaming::DataImporter)
      allow(data_importer).to receive(:call).and_return(
        [locations_data, measurements_data],
      )

      subject = described_class.new(data_importer: data_importer)

      expect { subject.call }.to change(Session, :count).by(1).and change(
                        Stream,
                        :count,
                      ).by(1).and change(FixedMeasurement, :count).by(3)

      session.reload
      expect(session.start_time_local).to eq(
        Time.zone.parse('2025-07-24T05:00:00'),
      )
      expect(session.end_time_local).to eq(
        Time.zone.parse('2025-07-24T07:00:00'),
      )
      expect(session.last_measurement_at).to eq(
        Time.zone.parse('2025-07-24T10:00:00'),
      )

      stream.reload
      expect(stream.average_value).to eq(5.3)

      created_session = Session.find_by(latitude: 44.647, longitude: -63.574)
      expect(created_session.title).to eq('JOHNSTON BUILDING')
      expect(created_session.start_time_local).to eq(
        Time.zone.parse('2025-07-24T07:00:00'),
      )
      expect(created_session.end_time_local).to eq(
        Time.zone.parse('2025-07-24T08:00:00'),
      )
      expect(created_session.last_measurement_at).to eq(
        Time.zone.parse('2025-07-24T11:00:00'),
      )
      created_stream = created_session.streams.first
      expect(created_stream.average_value).to eq(5.2)

      created_measurements_values = FixedMeasurement.pluck(:value)
      expected_values = [5.3, 4.2, 5.2]
      expect(created_measurements_values).to match_array(expected_values)
    end
  end
end
