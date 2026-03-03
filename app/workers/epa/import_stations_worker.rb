require 'sidekiq-scheduler'

module Epa
  class ImportStationsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform
      return unless A9n.sidekiq_epa_ingest_enabled

      Epa::Stations::Interactor.new.call
    end
  end
end
