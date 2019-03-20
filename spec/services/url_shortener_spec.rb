require 'rails_helper'

describe UrlShortener do
  let(:http_utils) { instance_double('HttpUtils') }

  it "returns a shortend link when post request is successful" do
    expect(http_utils).to receive(:post)
    expect(http_utils).to receive(:successful?).and_return(true)
    expect(http_utils).to receive(:body).and_return({ "link" => "http://bit.ly/2VVPWJI" })

    link = described_class.new(http_utils: http_utils).call("http://example.com")

    expect(link).to eq("http://bit.ly/2VVPWJI")
  end

  it "returns the same link when post request isn't successful" do
    expect(http_utils).to receive(:post)
    expect(http_utils).to receive(:successful?).and_return(false)

    link = described_class.new(http_utils: http_utils).call("http://example.com")

    expect(link).to eq("http://example.com")
  end
end
