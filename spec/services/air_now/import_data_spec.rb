require 'rails_helper'

RSpec.describe AirNow::ImportData, :vcr do
  describe '#call' do
    it 'returns location and hourly data with correct structure and correct data' do
      response = described_class.new.call

      locations_data, hourly_data = response
      example_hourly_data = hourly_data.second
      first_location = locations_data.split("\n").first
      first_measurement = example_hourly_data.split("\n").first

      expect(response).to_not be_empty
      expect(first_location.count("|")).to eq(22)
      expect(first_measurement.count("|")).to eq(8)
    end
  end
end
