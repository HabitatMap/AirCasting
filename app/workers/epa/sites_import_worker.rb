require 'sidekiq-scheduler'

module Epa
  class SitesImportWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform
      Epa::Sites::Interactor.new.call
    end
  end
end
