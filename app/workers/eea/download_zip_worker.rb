module Eea
  class DownloadZipWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      Eea::Measurements::Extract::ZipDownloader.new.call(batch_id: batch_id)
    end
  end
end
