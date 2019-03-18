require 'net/http'
require 'json'

BITLY_ACCESS_TOKEN = YAML.load_file("#{Rails.root.to_s}/config/configuration.yml")["defaults"]["bitly_access_token"]


module Api
  class ShortUrlController < BaseController
    def index
      long_url = params["longUrl"]

      begin
          uri = URI("https://api-ssl.bitly.com/v4/shorten")
          http = Net::HTTP.new(uri.host, uri.port)
          http.use_ssl = true

          req = Net::HTTP::Post.new(uri.path, {
              'Content-Type' =>'application/json',
              'Authorization' => "Bearer #{BITLY_ACCESS_TOKEN}"
            })
          req.body = {"long_url" => long_url}.to_json

          res = http.request(req)
          link = JSON.parse(res.body)["link"]
      rescue => _
          link = long_url
      end

      render plain: link
    end
  end
end
