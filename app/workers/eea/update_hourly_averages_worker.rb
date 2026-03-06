module Eea
  class UpdateHourlyAveragesWorker
    include Sidekiq::Worker

    sidekiq_options queue: :eea, retry: 1

    def perform
      HourlyAverages::ScheduledUpdater.new.call
    end
  end
end
