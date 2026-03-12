module Eea
  class LoadMeasurementsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      Eea::MeasurementsLoader.new.call(batch_id: batch_id)
      Eea::Measurements::Loader.new.call(batch_id: batch_id)
    end
  end
end
