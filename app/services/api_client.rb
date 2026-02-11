class ApiClient
  class RequestError < StandardError; end

  def initialize(base_url: nil, headers: {}, conn: nil)
    @conn = conn || Faraday.new(url: base_url, headers: headers)
  end

  def get(path)
    response = conn.get(path)
    handle_response(response, "GET #{path}")
  end

  def post(path, body:)
    response = conn.post(path, body)
    handle_response(response, "POST #{path}")
  end

  private

  attr_reader :conn

  def handle_response(response, request_description)
    unless response.success?
      raise RequestError, "#{request_description} failed with status #{response.status}"
    end

    response.body
  end
end
