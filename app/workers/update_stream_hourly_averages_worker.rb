require 'sidekiq-scheduler'

class UpdateStreamHourlyAveragesWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_averages_calculation_enabled

    StreamHourlyAverages::Updater.new.call
  end
end
