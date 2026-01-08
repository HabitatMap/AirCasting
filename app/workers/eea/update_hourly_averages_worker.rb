require 'sidekiq-scheduler'

module Eea
  class UpdateHourlyAveragesWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform(batch_id)
      return unless A9n.sidekiq_eea_import_enabled

      HourlyAverages::Updater.new.call(batch_id: batch_id)
    end
  end
end
