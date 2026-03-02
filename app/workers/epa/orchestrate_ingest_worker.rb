require 'sidekiq-scheduler'

module Epa
  class OrchestrateIngestWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform
      Epa::IngestOrchestrator.new.call
    end
  end
end
