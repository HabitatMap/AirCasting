module Api
  class ShortUrlController < BaseController
    def index
      render plain: UrlShortener.new.call(params["longUrl"])
    end
  end
end
