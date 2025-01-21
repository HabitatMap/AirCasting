require 'sidekiq-scheduler'

class UpdateStreamDailyAveragesWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_averages_calculation_enabled

    StreamDailyAverages::FixedActiveSessionsTraverser.new.call
  end
end
