require 'rails_helper'

describe Eea::ApiClient do
  describe '#fetch_zip_bytes' do
    it 'posts to correct endpoint with expected body' do
      client = instance_double(ApiClient)
      allow(client).to receive(:post).and_return('zip bytes')

      described_class.new(client: client).fetch_zip_bytes(
        country: 'PL',
        pollutant: 'PM2.5',
        window_starts_at: '2024-01-01T00:00:00Z',
        window_ends_at: '2024-01-01T06:00:00Z',
      )

      expect(client).to have_received(:post).with(
        '/ParquetFile',
        body: {
          countries: ['PL'],
          pollutants: ['PM2.5'],
          dateTimeStart: '2024-01-01T00:00:00Z',
          dateTimeEnd: '2024-01-01T06:00:00Z',
          cities: [],
          dataset: 1,
          aggregationType: 'hour',
        }.to_json,
      )
    end

    it 'returns response from client' do
      client = instance_double(ApiClient)
      allow(client).to receive(:post).and_return('zip bytes')

      result =
        described_class.new(client: client).fetch_zip_bytes(
          country: 'PL',
          pollutant: 'PM2.5',
          window_starts_at: '2024-01-01T00:00:00Z',
          window_ends_at: '2024-01-01T06:00:00Z',
        )

      expect(result).to eq('zip bytes')
    end
  end
end
