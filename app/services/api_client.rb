class ApiClient
  DEFAULT_HEADERS = {
    'Accept' => 'application/json',
    'Content-Type' => 'application/json',
  }

  def initialize(base_url:, headers: {})
    @conn = Faraday.new(url: base_url, headers: DEFAULT_HEADERS.merge(headers))
  end

  def post(path, body: {})
    response = conn.post(path, body)

    return response.body if response.status == 200
  end

  private

  attr_reader :conn
end
