class UrlShortener
  def initialize(http: Http.new)
    @http = http
  end

  def call(link)
    result =
      http.post(
        url: 'https://api-ssl.bitly.com/v4/shorten',
        token: A9n.bitly_access_token,
        body: {
          'long_url' => link
        }
      )

    if result.success?
      result.value['link']
    else
      puts "An error occured while shortening a link: #{result.errors}"
      link
    end
  end

  private

  attr_reader :http
end
