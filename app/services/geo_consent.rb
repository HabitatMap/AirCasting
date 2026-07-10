# Decides whether a request needs a prior-consent (opt-in) cookie banner based
# on the visitor's country.
#
# Countries with GDPR-style opt-in laws (EEA + UK + Switzerland) require the
# banner and a `denied` consent default. Everywhere else (US, Canada, and the
# rest of the world) uses implied/opt-out consent, so we default to `granted`
# and show no banner.
#
# Country is resolved from the client IP via country.is (free, no key, HTTPS,
# commercial use allowed) and cached per IP. We never rely on maxmemory
# eviction — the cache key carries a TTL.
#
# Fallback: if geolocation is unavailable (API error/timeout, private IP,
# unknown country) we treat the request as non-EU (opt-out, no banner). Ads run
# only in the US/CA and the bulk of traffic is non-EU, so an unresolved visitor
# is far more likely non-EU; defaulting to opt-out avoids showing an unnecessary
# banner and losing analytics/conversions for them.
class GeoConsent
  # EEA (27 EU + Norway, Iceland, Liechtenstein) + UK + Switzerland.
  STRICT_COUNTRIES = %w[
    AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE
    NO IS LI
    GB
    CH
  ].to_set.freeze

  API_URL = 'https://api.country.is'.freeze
  CACHE_TTL = 30.days
  TIMEOUT_SECONDS = 2

  def self.consent_required?(ip)
    new(ip).consent_required?
  end

  def initialize(ip, conn: nil)
    @ip = ip.to_s
    @conn = conn
  end

  def consent_required?
    country = country_code
    return false if country.nil? # unknown -> treat as non-EU (opt-out)

    STRICT_COUNTRIES.include?(country)
  end

  private

  # Returns an uppercase ISO-3166 alpha-2 code, or nil when it can't be
  # determined. Successful lookups are cached; failures are not, so a transient
  # outage doesn't get pinned for 30 days.
  def country_code
    return nil if @ip.blank?

    cached = Rails.cache.read(cache_key)
    return cached.presence && cached unless cached.nil?

    code = fetch_country_code
    Rails.cache.write(cache_key, code, expires_in: CACHE_TTL) if code
    code
  end

  def cache_key
    "geo:country:#{@ip}"
  end

  def fetch_country_code
    response = conn.get("#{API_URL}/#{@ip}") do |req|
      req.options.timeout = TIMEOUT_SECONDS
      req.options.open_timeout = TIMEOUT_SECONDS
    end
    return nil unless response.success?

    country = JSON.parse(response.body)['country']
    country.presence&.upcase
  rescue Faraday::Error, JSON::ParserError => e
    Rails.logger.warn("[GeoConsent] lookup failed for #{@ip}: #{e.class} #{e.message}")
    nil
  end

  def conn
    @conn ||= Faraday.new
  end
end
