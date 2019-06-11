require 'rails_helper'

describe UrlShortener do
  let(:http) { instance_double('Http') }

  it 'returns a shortend link when post request is successful' do
    expect(http).to receive(:post) {
      Success.new({ 'link' => 'http://bit.ly/2VVPWJI' })
    }

    link = described_class.new(http: http).call('http://example.com')

    expect(link).to eq('http://bit.ly/2VVPWJI')
  end

  it "returns the same link when post request isn't successful" do
    expect(http).to receive(:post) { Failure.new({}) }

    link = described_class.new(http: http).call('http://example.com')

    expect(link).to eq('http://example.com')
  end
end
