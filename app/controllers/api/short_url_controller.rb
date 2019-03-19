require 'net/http'
require 'json'

module Api
  class ShortUrlController < BaseController
    def index
      link = params["longUrl"]

      uri = URI("https://api-ssl.bitly.com/v4/shorten")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      req = Net::HTTP::Post.new(uri.path, {
          'Content-Type' =>'application/json',
          'Authorization' => "Bearer #{A9n.bitly_access_token}"
        })
      req.body = {"long_url" => link}.to_json

      res = http.request(req)

      if res.is_a?(Net::HTTPSuccess)
        link = JSON.parse(res.body)["link"]
      end

      render plain: link
    end
  end
end
