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
end
