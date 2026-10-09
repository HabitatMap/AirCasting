class RebuildStationStreamDailyAveragesWorker
  include Sidekiq::Worker

  sidekiq_options queue: :slow

  def perform(stream_ids)
    return unless A9n.sidekiq_averages_calculation_enabled

    GovernmentSources::StationStreamDailyAveragesRebuilder.new.call(
      stream_ids: stream_ids,
    )
  end
end
