require 'sidekiq-scheduler'

class UpdateStationStreamDailyAveragesWorker
  include Sidekiq::Worker

  def perform
    GovernmentSources::StationStreamDailyAveragesCalculator.new.call
  end
end
