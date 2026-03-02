module Epa
  class TransformWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform(batch_id)
      Epa::Measurements::Transformer.new.call(batch_id: batch_id)
    end
  end
end
