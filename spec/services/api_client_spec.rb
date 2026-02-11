require 'rails_helper'

describe ApiClient do
  def build_test_connection(&block)
    stubs = Faraday::Adapter::Test::Stubs.new(&block)
    Faraday.new { |b| b.adapter :test, stubs }
  end

  describe '#get' do
    it 'returns response body on success' do
      conn = build_test_connection do |stub|
        stub.get('/path') { [200, {}, 'response data'] }
      end

      result = described_class.new(conn: conn).get('/path')

      expect(result).to eq('response data')
    end

    it 'raises RequestError on failure' do
      conn = build_test_connection do |stub|
        stub.get('/path') { [404, {}, ''] }
      end

      expect { described_class.new(conn: conn).get('/path') }
        .to raise_error(ApiClient::RequestError, 'GET /path failed with status 404')
    end
  end

  describe '#post' do
    it 'returns response body on success' do
      conn = build_test_connection do |stub|
        stub.post('/path') { [200, {}, 'response data'] }
      end

      result = described_class.new(conn: conn).post('/path', body: '{"key":"value"}')

      expect(result).to eq('response data')
    end

    it 'raises RequestError on failure' do
      conn = build_test_connection do |stub|
        stub.post('/path') { [500, {}, ''] }
      end

      expect { described_class.new(conn: conn).post('/path', body: '') }
        .to raise_error(ApiClient::RequestError, 'POST /path failed with status 500')
    end
  end
end
