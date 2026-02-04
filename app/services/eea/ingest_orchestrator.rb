module Eea
  class IngestOrchestrator
    COUNTRIES = %w[
      AD AL AT BA BE BG CH CY CZ DE DK EE ES FI FR GB GE GR HR HU
      IE IS IT LT LU LV ME MK MT NL NO PL PT RO RS SE SI SK TR UA XK
    ].freeze
    POLLUTANTS = %w[PM2.5 NO2 O3].freeze

    def initialize(ingest_batch_enqueuer: IngestBatchEnqueuer.new)
      @ingest_batch_enqueuer = ingest_batch_enqueuer
    end

    def call
      window_ends_at = Time.current.utc
      window_starts_at = window_ends_at - 6.hours

      COUNTRIES
        .product(POLLUTANTS)
        .each do |country, pollutant|
          ingest_batch_enqueuer.call(
            country: country,
            pollutant: pollutant,
            window_starts_at: window_starts_at,
            window_ends_at: window_ends_at,
          )
        end
    end

    private

    attr_reader :ingest_batch_enqueuer
  end
end
