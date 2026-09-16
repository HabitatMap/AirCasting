require 'rails_helper'

RSpec.describe Api::ListMobileSessionsContract do
  subject(:contract) { described_class.new }

  it 'succeeds with no params (both optional, defaults applied by the caller)' do
    result = contract.call({})
    expect(result).to be_success
    expect(result.to_h).to eq({})
  end

  it 'drops route params' do
    result = contract.call(controller: 'api/v3/mobile_sessions', action: 'index', format: 'json')
    expect(result).to be_success
    expect(result.to_h).to eq({})
  end

  it 'coerces numeric strings, which is how they arrive in a query string' do
    result = contract.call(page: '2', per_page: '50')
    expect(result).to be_success
    expect(result.to_h).to eq(page: 2, per_page: 50)
  end

  describe 'per_page' do
    it 'rejects a non-numeric value rather than silently returning nothing' do
      result = contract.call(per_page: 'abc')
      expect(result).to be_failure
      expect(result.errors[:per_page]).to be_present
    end

    it 'rejects an empty string' do
      result = contract.call(per_page: '')
      expect(result).to be_failure
      expect(result.errors[:per_page]).to be_present
    end

    it 'rejects zero' do
      result = contract.call(per_page: '0')
      expect(result).to be_failure
      expect(result.errors[:per_page]).to be_present
    end

    it 'rejects a negative value (would be LIMIT -5)' do
      result = contract.call(per_page: '-5')
      expect(result).to be_failure
      expect(result.errors[:per_page]).to be_present
    end

    it "rejects a value above the cap" do
      result = contract.call(per_page: described_class::MAX_PER_PAGE + 1)
      expect(result).to be_failure
      expect(result.errors[:per_page]).to be_present
    end

    it 'accepts the cap itself' do
      expect(contract.call(per_page: described_class::MAX_PER_PAGE)).to be_success
    end
  end

  describe 'page' do
    it 'rejects a non-numeric value' do
      result = contract.call(page: 'abc')
      expect(result).to be_failure
      expect(result.errors[:page]).to be_present
    end

    it 'rejects zero' do
      result = contract.call(page: '0')
      expect(result).to be_failure
      expect(result.errors[:page]).to be_present
    end

    it 'rejects a negative value (would be OFFSET -2)' do
      result = contract.call(page: '-1')
      expect(result).to be_failure
      expect(result.errors[:page]).to be_present
    end

    it 'accepts a page far past the end — an empty page is a valid answer' do
      expect(contract.call(page: 10_000)).to be_success
    end
  end
end
