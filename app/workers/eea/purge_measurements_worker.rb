module Eea
  class PurgeMeasurementsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform
      Eea::MeasurementsPurger.new.call
    end
  end
end
