module Api
  class ShortUrlController < BaseController
    def index
      GoogleAnalytics.new.register_event('Short URL#index')
      render json: { short_url: UrlShortener.new.call(params['longUrl']) }
    end
  end
end
