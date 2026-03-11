module Eea
  class CleanupBatchWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      Eea::BatchCleanup.new.call(batch_id: batch_id)
    end
  end
end
