module Epa
  class IngestOrchestrator
    HOURS_TO_PROCESS = 24

    def initialize(ingest_batch_enqueuer: IngestBatchEnqueuer.new)
      @ingest_batch_enqueuer = ingest_batch_enqueuer
    end

    def call
      most_recent_closed_hour = Time.current.beginning_of_hour - 1.hour

      HOURS_TO_PROCESS.times do |offset|
        measured_at = most_recent_closed_hour - offset.hours

        ingest_batch_enqueuer.call(measured_at: measured_at)
      end
    end

    private

    attr_reader :ingest_batch_enqueuer
  end
end
