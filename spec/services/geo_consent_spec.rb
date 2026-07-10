require 'rails_helper'

describe GeoConsent do
  def connection(&block)
    stubs = Faraday::Adapter::Test::Stubs.new(&block)
    Faraday.new { |b| b.adapter :test, stubs }
  end

  def country_response(ip, country)
    connection do |stub|
      stub.get("/#{ip}") do
        [200, { 'Content-Type' => 'application/json' }, { ip: ip, country: country }.to_json]
      end
    end
  end

  def consent_required?(ip, conn)
    described_class.new(ip, conn: conn).consent_required?
  end

  describe '#consent_required?' do
    context 'consent-required countries (EEA/UK/CH)' do
      %w[PL DE FR NO IS LI GB CH].each do |code|
        it "returns true for #{code}" do
          expect(consent_required?('1.2.3.4', country_response('1.2.3.4', code))).to be true
        end
      end
    end

    context 'opt-out / rest-of-world countries' do
      %w[US CA BR JP AU].each do |code|
        it "returns false for #{code}" do
          expect(consent_required?('1.2.3.4', country_response('1.2.3.4', code))).to be false
        end
      end
    end

    it 'is case-insensitive on the country code' do
      expect(consent_required?('1.2.3.4', country_response('1.2.3.4', 'de'))).to be true
    end

    context 'fail-safe (defaults to requiring consent)' do
      it 'returns true when the API returns an error' do
        conn = connection { |stub| stub.get('/1.2.3.4') { [500, {}, ''] } }
        expect(consent_required?('1.2.3.4', conn)).to be true
      end

      it 'returns true when the request times out' do
        conn = connection { |stub| stub.get('/1.2.3.4') { raise Faraday::TimeoutError } }
        expect(consent_required?('1.2.3.4', conn)).to be true
      end

      it 'returns true when the response has no country' do
        conn = connection do |stub|
          stub.get('/1.2.3.4') { [200, {}, { ip: '1.2.3.4' }.to_json] }
        end
        expect(consent_required?('1.2.3.4', conn)).to be true
      end

      it 'returns true for a blank IP without calling the API' do
        conn = connection { |stub| stub.get(//) { raise 'should not be called' } }
        expect(consent_required?('', conn)).to be true
      end
    end

    context 'caching' do
      it 'serves a cached country without hitting the API again' do
        allow(Rails.cache).to receive(:read).with('geo:country:1.2.3.4').and_return('US')
        conn = connection { |stub| stub.get('/1.2.3.4') { raise 'should not be called' } }

        expect(consent_required?('1.2.3.4', conn)).to be false
      end

      it 'caches a successful lookup' do
        allow(Rails.cache).to receive(:read).and_return(nil)
        expect(Rails.cache).to receive(:write).with('geo:country:1.2.3.4', 'US', hash_including(expires_in: GeoConsent::CACHE_TTL))

        consent_required?('1.2.3.4', country_response('1.2.3.4', 'US'))
      end

      it 'does not cache a failed lookup' do
        allow(Rails.cache).to receive(:read).and_return(nil)
        expect(Rails.cache).not_to receive(:write)
        conn = connection { |stub| stub.get('/1.2.3.4') { [500, {}, ''] } }

        consent_required?('1.2.3.4', conn)
      end
    end
  end
end
