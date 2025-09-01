require 'rails_helper'

RSpec.describe AirNowStreaming::StreamsDefaultValuesFetcher do
  subject { described_class.new }

  describe '#call' do
    it 'returns default values with fetched threshold_set IDs' do
      pm25 = create(:threshold_set, sensor_name: 'Government-PM2.5')
      no2 = create(:threshold_set, sensor_name: 'Government-NO2')
      ozone = create(:threshold_set, sensor_name: 'Government-Ozone')

      result = subject.call

      expected_result = {
        'Government-PM2.5' => {
          sensor_name: 'Government-PM2.5',
          unit_name: 'microgram per cubic meter',
          measurement_type: 'Particulate Matter',
          measurement_short_type: 'PM',
          unit_symbol: 'µg/m³',
          threshold_set_id: pm25.id,
          sensor_package_name: 'Government-PM2.5',
        },
        'Government-NO2' => {
          sensor_name: 'Government-NO2',
          unit_name: 'parts per billion',
          measurement_type: 'Nitrogen Dioxide',
          measurement_short_type: 'NO2',
          unit_symbol: 'ppb',
          threshold_set_id: no2.id,
          sensor_package_name: 'Government-NO2',
        },
        'Government-Ozone' => {
          sensor_name: 'Government-Ozone',
          unit_name: 'parts per billion',
          measurement_type: 'Ozone',
          measurement_short_type: 'O3',
          unit_symbol: 'ppb',
          threshold_set_id: ozone.id,
          sensor_package_name: 'Government-Ozone',
        },
      }

      expect(result).to eq(expected_result)
    end
  end
end
