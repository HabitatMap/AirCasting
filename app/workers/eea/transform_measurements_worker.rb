module Eea
  class TransformMeasurementsWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      Eea::Measurements::Transformer.new.call(batch_id: batch_id)
    end
  end
end
