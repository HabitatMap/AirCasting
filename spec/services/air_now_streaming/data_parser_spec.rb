require 'rails_helper'

RSpec.describe AirNowStreaming::DataParser do
  subject { described_class.new }

  describe '#call' do
    it 'processes locations and measurements correctly' do
      locations_data =
        "000020401|PM2.5|0401|SOUTHAMPTON|Active|PE1|Canada-Prince Edward Island1|CA|46.386400|-62.582800|15.300|-4.00|CA|||||00|CC|002|PRINCE EDWARD ISLAND||\n" +
          "000020401|NO2|0401|SOUTHAMPTON|Active|PE1|Canada-Prince Edward Island1|CA|46.386400|-62.582800|15.300|-4.00|CA|||||00|CC|002|PRINCE EDWARD ISLAND||\n" +
          "000020401|NO|0401|SOUTHAMPTON|Active|PE1|Canada-Prince Edward Island1|CA|46.386400|-62.582800|15.300|-4.00|CA|||||00|CC|002|PRINCE EDWARD ISLAND||\n" +
          "000030113|PM2.5|0113|JOHNSTON BUILDING|Active|NS1|Canada-Nova Scotia1|CA|44.647175|-63.573689|29.000|-4.00|CA|||||00|CC|003|NOVA SCOTIA||\n" +
          '000030113|SO2|0113|JOHNSTON BUILDING|Active|NS1|Canada-Nova Scotia1|CA|44.647175|-63.573689|29.000|-4.00|CA|||||00|CC|003|NOVA SCOTIA||'

      measurements_data =
        "07/24/25|09:00|000020401|SOUTHAMPTON|-4|NO|PPB|0|Canada-Prince Edward Island1\n" +
          "07/24/25|09:00|000020401|SOUTHAMPTON|-4|NO2|PPB|0.7|Canada-Prince Edward Island1\n" +
          "07/24/25|09:00|000020401|SOUTHAMPTON|-4|PM2.5|UG/M3|5.3|Canada-Prince Edward Island1\n" +
          "07/24/25|09:00|000030113|JOHNSTON BUILDING|-4|PM2.5|UG/M3|4.2|Canada-Nova Scotia1\n" +
          "07/24/25|10:00|000030113|JOHNSTON BUILDING|-4|PM2.5|UG/M3|5.2|Canada-Nova Scotia1\n" +
          '07/24/25|09:00|000030113|JOHNSTON BUILDING|-4|SO2|PPB|0|Canada-Nova Scotia1'

      result =
        subject.call(
          locations_data: locations_data,
          measurements_data: measurements_data,
        )

      expect(result).to eq(
        {
          {
            latitude: 46.386,
            longitude: -62.583,
            sensor_name: 'Government-PM2.5',
          } => [
            {
              time: Time.zone.parse('2025-07-24T07:00:00'),
              time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
              time_zone: 'America/Halifax',
              title: 'SOUTHAMPTON',
              value: 5.3,
            },
          ],
          {
            latitude: 46.386,
            longitude: -62.583,
            sensor_name: 'Government-NO2',
          } => [
            {
              time: Time.zone.parse('2025-07-24T07:00:00'),
              time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
              time_zone: 'America/Halifax',
              title: 'SOUTHAMPTON',
              value: 0.7,
            },
          ],
          {
            latitude: 44.647,
            longitude: -63.574,
            sensor_name: 'Government-PM2.5',
          } => [
            {
              time: Time.zone.parse('2025-07-24T07:00:00'),
              time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
              time_zone: 'America/Halifax',
              title: 'JOHNSTON BUILDING',
              value: 4.2,
            },
            {
              time: Time.zone.parse('2025-07-24T08:00:00'),
              time_with_time_zone: Time.zone.parse('2025-07-24T11:00:00'),
              time_zone: 'America/Halifax',
              title: 'JOHNSTON BUILDING',
              value: 5.2,
            },
          ],
        },
      )
    end

    context 'when O3 is listed as parameter' do
      it 'sets paramater name to Government-Ozone' do
        locations_data =
          '000030113|O3|0113|JOHNSTON BUILDING|Active|NS1|Canada-Nova Scotia1|CA|44.647175|-63.573689|29.000|-4.00|CA|||||00|CC|003|NOVA SCOTIA||'

        measurements_data =
          '07/24/25|09:00|000030113|JOHNSTON BUILDING|-4|O3|PPB|29|Canada-Nova Scotia1'

        result =
          subject.call(
            locations_data: locations_data,
            measurements_data: measurements_data,
          )

        expect(result).to eq(
          {
            {
              latitude: 44.647,
              longitude: -63.574,
              sensor_name: 'Government-Ozone',
            } => [
              {
                time: Time.zone.parse('2025-07-24T07:00:00'),
                time_with_time_zone: Time.zone.parse('2025-07-24T10:00:00'),
                time_zone: 'America/Halifax',
                title: 'JOHNSTON BUILDING',
                value: 29.0,
              },
            ],
          },
        )
      end
    end

    context 'when aqsid assigned to a measurement is missing on a location list' do
      it 'ignores measurements with missing location data' do
        locations_data =
          '000020401|PM2.5|0401|SOUTHAMPTON|Active|PE1|Canada-Prince Edward Island1|CA|46.386400|-62.582800|15.300|-4.00|CA|||||00|CC|002|PRINCE EDWARD ISLAND||'
        measurements_data =
          '07/24/25|09:00|000030113|JOHNSTON BUILDING|-4|PM2.5|UG/M3|4.2|Canada-Nova Scotia1'

        result =
          subject.call(
            locations_data: locations_data,
            measurements_data: measurements_data,
          )

        expect(result).to eq({})
      end
    end
  end
end
