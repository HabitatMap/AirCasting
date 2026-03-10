require 'sidekiq-scheduler'

class UpdateStationStreamDailyAveragesWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_averages_calculation_enabled

    GovernmentSources::StationStreamDailyAveragesCalculator.new.call
  end
end
