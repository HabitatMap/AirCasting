module GovernmentSources
  # Recomputes the whole daily-average history of the given streams, for when
  # their time zone changed. The hourly calculator only redoes the last two days.
  #
  # Deletes before it inserts: the upsert never removes a row, and a date that
  # existed only under the old zone would otherwise keep a stale value.
  class StationStreamDailyAveragesRebuilder
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(stream_ids:)
      StationStream
        .where(id: stream_ids)
        .group_by(&:time_zone)
        .each do |time_zone, streams|
          ids = streams.map(&:id)
          first_measured_at = streams.filter_map(&:first_measured_at).min

          StationStream.transaction do
            repository.delete_station_stream_daily_averages(stream_ids: ids)
            if first_measured_at
              repository.upsert_station_stream_daily_averages(
                stream_ids: ids,
                time_zone: time_zone,
                # A measurement at local midnight counts towards the day before.
                since: first_measured_at - 1.day,
              )
            end
          end
        end
    end

    private

    attr_reader :repository
  end
end
