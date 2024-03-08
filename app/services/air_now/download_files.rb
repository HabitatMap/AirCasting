class AirNow::DownloadFiles
  def initialize(url)
    @url = url
  end

  def fetch
    uri = URI(url)
    response = Net::HTTP.get(uri)
    response
  end

  attr_accessor :url
end
