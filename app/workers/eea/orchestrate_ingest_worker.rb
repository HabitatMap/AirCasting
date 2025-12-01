require 'sidekiq-scheduler'

module Eea
  class OrchestrateIngestWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform
      return unless A9n.sidekiq_eea_import_enabled

      Eea::IngestOrchestrator.new.call
    end
  end
end
