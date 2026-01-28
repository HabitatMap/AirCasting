require 'sidekiq-scheduler'

module Eea
  class PurgeMeasurementsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform
      return unless A9n.sidekiq_eea_import_enabled

      Eea::MeasurementsPurger.new.call
    end
  end
end
