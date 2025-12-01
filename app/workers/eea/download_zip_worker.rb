require 'sidekiq-scheduler'

module Eea
  class DownloadZipWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      return unless A9n.sidekiq_eea_import_enabled

      Eea::ZipDownloader.new.call(batch_id: batch_id)
    end
  end
end
