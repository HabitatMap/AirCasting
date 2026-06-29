class ShortenedUrl < ApplicationRecord
  SLUG_LENGTH = 8
  ALPHABET = [*'0'..'9', *'a'..'z', *'A'..'Z'].freeze # base62

  validates :slug, :long_url, :url_hash, presence: true
  validates :slug, :url_hash, uniqueness: true

  # Finds an existing short link for the given URL or creates one.
  # Identical URLs are deduplicated via url_hash so the table does not grow
  # on repeated shares of the same view.
  def self.shorten(long_url)
    hash = Digest::SHA256.hexdigest(long_url)

    find_or_create_by!(url_hash: hash) do |record|
      record.long_url = long_url
      record.slug = generate_slug
    end
  rescue ActiveRecord::RecordNotUnique
    # Lost a race on url_hash (concurrent insert) or hit a rare slug collision.
    retry
  end

  def self.generate_slug
    loop do
      slug = Array.new(SLUG_LENGTH) { ALPHABET.sample }.join
      break slug unless exists?(slug: slug)
    end
  end
end
