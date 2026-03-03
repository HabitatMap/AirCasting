require 'sidekiq-scheduler'

module Epa
  class TriggerIngestWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform
      return unless A9n.sidekiq_epa_ingest_enabled

      Epa::OrchestrateIngestWorker.perform_async
    end
  end
end
