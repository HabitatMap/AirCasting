module Epa
  class LoadMeasurementsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform(batch_id)
      Epa::Measurements::Loader.new.call(batch_id: batch_id)
    end
  end
end
