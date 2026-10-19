module Api
  # Query parameters for GET /api/v3/explore/map.
  #
  # `sources` and `measurement_types` are comma-separated lists, not repeated keys:
  # Retrofit and URLQueryItem repeat a key without `[]`, and Rails keeps only
  # the last. Omitted or empty means all. An unknown value is a 400, not
  # ignored — a typo silently widening the filter to everything would look
  # like a working filter.
  #
  # `zoom` is a whole number: the client rounds its map's zoom, as the web map
  # does before clustering.
  class ExploreMapContract < Dry::Validation::Contract
    MAX_ZOOM = 22

    params do
      required(:west).filled(:float, gteq?: -180, lteq?: 180)
      required(:east).filled(:float, gteq?: -180, lteq?: 180)
      required(:south).filled(:float, gteq?: -90, lteq?: 90)
      required(:north).filled(:float, gteq?: -90, lteq?: 90)
      required(:zoom).filled(:integer, gteq?: 0, lteq?: MAX_ZOOM)
      optional(:sources).maybe(:string)
      optional(:measurement_types).maybe(:string)
    end

    def self.list(value)
      value.to_s.split(',').map(&:strip).reject(&:empty?).uniq
    end

    # west > east is valid: the viewport crosses the antimeridian.
    rule(:north, :south) do
      if values[:north] < values[:south]
        key(:north).failure('must be greater than or equal to south')
      end
    end

    rule(:sources) do
      unknown = ExploreMapContract.list(value) - Explore::Map::SOURCES
      key.failure("unknown: #{unknown.join(', ')}") if unknown.any?
    end

    rule(:measurement_types) do
      unknown = ExploreMapContract.list(value) - Explore::Parameters::KEYS
      key.failure("unknown: #{unknown.join(', ')}") if unknown.any?
    end
  end
end
