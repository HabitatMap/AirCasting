module Api
  class ShortUrlController < BaseController
    def create
      long_url = params.require(:longUrl)

      unless same_host?(long_url)
        return render json: { error: 'Invalid URL' }, status: :unprocessable_entity
      end

      render json: { short_url: build_short_url(long_url) }
    end

    private

    # Returns a short link, or falls back to the original URL when shortening is
    # unavailable (e.g. a read-only database on staging). The caller copies
    # whatever comes back, so the feature degrades silently instead of erroring.
    def build_short_url(long_url)
      record = ShortenedUrl.shorten(long_url)
      short_link_url(record.slug)
    rescue StandardError => e
      Rails.logger.warn("ShortUrl falling back to full URL: #{e.message}")
      long_url
    end

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
