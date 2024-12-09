require 'sidekiq-scheduler'

class UpdateStreamHourlyAveragesWorker
  include Sidekiq::Worker

  def perform
    StreamHourlyAverages::Updater.new.call
  end
end
