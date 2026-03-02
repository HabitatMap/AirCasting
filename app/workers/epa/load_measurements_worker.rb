module Epa
  class LoadMeasurementsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform(load_batch_id)
      Epa::Measurements::Loader.new.call(load_batch_id: load_batch_id)
    end
  end
end
