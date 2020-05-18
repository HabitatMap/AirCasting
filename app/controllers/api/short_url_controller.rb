module Api
  class ShortUrlController < BaseController
    def index
      GoogleAnalyticsWorker::RegisterEvent.async_call('Short URL#index')
      render json: { short_url: UrlShortener.new.call(params['longUrl']) }
    end
  end
end
