require 'sidekiq-scheduler'

module Eea
  class TriggerIngestWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform
      return unless A9n.sidekiq_eea_import_enabled

      Eea::OrchestrateIngestWorker.perform_async
    end
  end
end
