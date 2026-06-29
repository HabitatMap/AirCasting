module Api
  class ShortUrlController < BaseController
    def create
      long_url = params.require(:longUrl)

      unless same_host?(long_url)
        return render json: { error: 'Invalid URL' }, status: :unprocessable_entity
      end

      record = ShortenedUrl.shorten(long_url)
      render json: { short_url: short_link_url(record.slug) }
    end

    private

    # Only allow shortening URLs that point back at this app, to prevent the
    # redirect endpoint from being abused as an open redirector.
    def same_host?(url)
      uri = URI.parse(url)
      uri.host.present? && uri.host == request.host
    rescue URI::InvalidURIError
      false
    end

    def short_link_url(slug)
      "#{request.base_url}/l/#{slug}"
    end
  end
end
