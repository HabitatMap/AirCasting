module Api
  class ShortUrlController < BaseController
    def index
      render json: { short_url: UrlShortener.new.call(params['longUrl']) }
    end
  end
end
