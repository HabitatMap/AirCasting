require 'sidekiq-scheduler'

module Epa
  class StationsImportWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform
      Epa::Stations::Interactor.new.call
    end
  end
end
