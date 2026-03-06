module Eea
  class OrchestrateIngestWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform
      Eea::IngestOrchestrator.new.call
    end
  end
end
