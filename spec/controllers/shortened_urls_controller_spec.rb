require 'rails_helper'

describe ShortenedUrlsController do
  describe "GET 'show'" do
    let!(:record) do
      ShortenedUrl.shorten('http://test.host/?sessionId=1&boundEast=-73.3')
    end

    it 'redirects to the long url with a 301' do
      get :show, params: { slug: record.slug }

      expect(response).to have_http_status(:moved_permanently)
      expect(response).to redirect_to(record.long_url)
    end

    it 'increments the click count' do
      expect { get :show, params: { slug: record.slug } }
        .to change { record.reload.click_count }.by(1)
    end

    it 'sends a no-cache header so repeat clicks stay trackable' do
      get :show, params: { slug: record.slug }

      expect(response.headers['Cache-Control']).to include('no-cache')
    end

    it 'redirects unknown slugs to the home page' do
      get :show, params: { slug: 'nonexistent' }

      expect(response).to redirect_to(root_path)
    end
  end
end
