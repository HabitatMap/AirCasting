module Epa
  class ExtractWorker
    include Sidekiq::Worker

    sidekiq_options queue: :epa, retry: 1

    def perform(batch_id)
      Epa::Measurements::Extractor.new.call(batch_id: batch_id)
    end
  end
end
