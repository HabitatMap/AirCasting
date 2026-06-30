require 'rails_helper'

describe Api::ShortUrlController do
  describe "POST 'create'" do
    context 'with a same-host url' do
      let(:long_url) { 'http://test.host/?sessionId=1&boundEast=-73.3' }

      it 'returns a short link pointing at this app' do
        post :create, format: :json, params: { longUrl: long_url }

        expect(response).to have_http_status(:ok)
        record = ShortenedUrl.last
        expect(json_response['short_url']).to eq("http://test.host/l/#{record.slug}")
      end

      it 'reuses the short link for a repeated url' do
        post :create, format: :json, params: { longUrl: long_url }
        expect { post :create, format: :json, params: { longUrl: long_url } }
          .not_to change(ShortenedUrl, :count)
      end
    end

    context 'when the database is unavailable for writes (e.g. read-only staging)' do
      let(:long_url) { 'http://test.host/?sessionId=1' }

      before do
        allow(ShortenedUrl).to receive(:shorten)
          .and_raise(ActiveRecord::StatementInvalid, 'PG::InsufficientPrivilege')
      end

      it 'falls back to the full url without erroring' do
        post :create, format: :json, params: { longUrl: long_url }

        expect(response).to have_http_status(:ok)
        expect(json_response['short_url']).to eq(long_url)
      end
    end

    context 'with a different-host url' do
      it 'rejects the request' do
        post :create, format: :json, params: { longUrl: 'http://evil.example.com/steal' }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(ShortenedUrl.count).to eq(0)
      end
    end

    context 'with a malformed url' do
      it 'rejects the request' do
        post :create, format: :json, params: { longUrl: 'http://[invalid' }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
