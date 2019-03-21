require 'net/http'
require 'json'

class Http
  def post(url:, token:, body:)
    begin
      uri = URI(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true

      req = Net::HTTP::Post.new(uri.path, {
          'Content-Type' =>'application/json',
          'Authorization' => "Bearer #{token}"
        })
      req.body = body.to_json

      result = http.request(req)
    rescue
      return Failure.new($!)
    end

    successful?(result) ? Success.new(JSON.parse(result.body)) : Failure.new(result.body)
  end

  private

  def successful?(res)
    res.is_a?(Net::HTTPSuccess)
  end
end
