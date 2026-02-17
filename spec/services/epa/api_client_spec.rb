require 'rails_helper'

describe Epa::ApiClient do
  describe '#fetch_locations' do
    it 'fetches from correct endpoint' do
      client = instance_double(ApiClient)
      allow(client).to receive(:get).and_return('data')

      described_class.new(client: client).fetch_locations

      expect(client).to have_received(:get)
        .with('/files.airnowtech.org/airnow/today/monitoring_site_locations.dat')
    end

    it 'returns response from client' do
      client = instance_double(ApiClient)
      allow(client).to receive(:get).and_return('location|data')

      result = described_class.new(client: client).fetch_locations

      expect(result).to eq('location|data')
    end
  end

  describe '#fetch_hourly_data' do
    it 'fetches from correct endpoint with formatted timestamp' do
      client = instance_double(ApiClient)
      allow(client).to receive(:get).and_return('data')
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')

      described_class.new(client: client).fetch_hourly_data(measured_at: measured_at)

      expect(client).to have_received(:get)
        .with('/files.airnowtech.org/airnow/today/HourlyData_2025072409.dat')
    end

    it 'returns response from client' do
      client = instance_double(ApiClient)
      allow(client).to receive(:get).and_return('measurement|data')
      measured_at = Time.parse('2025-07-24 09:00:00 UTC')

      result = described_class.new(client: client).fetch_hourly_data(measured_at: measured_at)

      expect(result).to eq('measurement|data')
    end
  end
end
