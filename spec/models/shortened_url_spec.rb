require 'rails_helper'

describe ShortenedUrl do
  describe '.shorten' do
    let(:url) { 'http://test.host/?sessionId=1&boundEast=-73.3' }

    it 'creates a record with a slug for a new url' do
      record = described_class.shorten(url)

      expect(record).to be_persisted
      expect(record.long_url).to eq(url)
      expect(record.slug.length).to eq(described_class::SLUG_LENGTH)
    end

    it 'deduplicates identical urls' do
      first = described_class.shorten(url)
      second = described_class.shorten(url)

      expect(second.id).to eq(first.id)
      expect(described_class.count).to eq(1)
    end

    it 'creates distinct records for different urls' do
      described_class.shorten("#{url}&a=1")
      described_class.shorten("#{url}&a=2")

      expect(described_class.count).to eq(2)
    end

    it 'generates slugs from the base62 alphabet' do
      slug = described_class.shorten(url).slug

      expect(slug).to match(/\A[0-9a-zA-Z]{#{described_class::SLUG_LENGTH}}\z/)
    end
  end

  describe '.generate_slug' do
    it 'returns a slug that is not already taken' do
      existing = described_class.shorten('http://test.host/?a=1').slug
      allow(described_class).to receive(:exists?).and_call_original

      expect(described_class.generate_slug).not_to eq(existing)
    end
  end
end
