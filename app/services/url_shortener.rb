require 'net/http'
require 'json'

class UrlShortener
  def initialize(http_utils: HttpUtils.new)
    @http_utils = http_utils
  end

  def call(link)
    begin
      result = http_utils.post(
        url: "https://api-ssl.bitly.com/v4/shorten",
        token: A9n.bitly_access_token,
        body: { "long_url" => link },
      )
      if http_utils.successful?(result)
        link = http_utils.body(result)["link"]
      end
    rescue
    end

    link
  end

  private
  attr_reader :http_utils
end
