require 'sidekiq-scheduler'

class UpdateHourlyAveragesForAirNowStreamsWorker
  include Sidekiq::Worker

  def perform(measurement_ids)
    return unless A9n.sidekiq_averages_calculation_enabled

    StreamHourlyAverages::AirNow::Updater.new.call(
      measurement_ids: measurement_ids,
    )
  end
end
