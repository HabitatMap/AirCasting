module GovernmentSources
  class StationStreamDailyAveragesCalculator
    DEFAULT_LOOKBACK_DAYS = 1
    DEFAULT_STREAM_UPDATED_WITHIN = 1.hour

    def initialize(
      lookback_days: DEFAULT_LOOKBACK_DAYS,
      stream_updated_within: DEFAULT_STREAM_UPDATED_WITHIN,
      repository: Repository.new
    )
      @lookback_days = lookback_days
      @stream_updated_within = stream_updated_within
      @repository = repository
    end

    def call
      Rails.logger.info('STARTING: Recalculating station stream daily averages')

      streams_by_timezone =
        repository
          .recently_updated_station_streams(since: stream_updated_within.ago.utc)
          .group_by(&:time_zone)

      streams_by_timezone.each do |time_zone, streams|
        repository.upsert_station_stream_daily_averages(
          stream_ids: streams.map(&:id),
          time_zone: time_zone,
          since: lookback_days.days.ago.in_time_zone(time_zone).beginning_of_day.utc,
        )
      end

      Rails.logger.info('FINISHED: Station stream daily averages recalculated')
    end

    private

    attr_reader :lookback_days, :stream_updated_within, :repository
  end
end
