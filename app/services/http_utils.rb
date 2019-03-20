require 'net/http'
require 'json'

class HttpUtils
  def post(url:, token:, body:)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Post.new(uri.path, {
        'Content-Type' =>'application/json',
        'Authorization' => "Bearer #{token}"
      })
    req.body = body.to_json

    http.request(req)
  end

  def successful?(res)
    res.is_a?(Net::HTTPSuccess)
  end

  def body(res)
    JSON.parse(res.body)
  end
end
