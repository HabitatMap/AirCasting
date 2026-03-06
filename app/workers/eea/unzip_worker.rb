module Eea
  class UnzipWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      Eea::Measurements::Extract::Unzipper.new.call(batch_id: batch_id)
    end
  end
end
