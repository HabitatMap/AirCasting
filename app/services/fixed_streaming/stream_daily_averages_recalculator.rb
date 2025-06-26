module FixedStreaming
  class StreamDailyAveragesRecalculator
    def initialize(updater: StreamDailyAverages::Updater.new)
      @updater = updater
    end

    def call(measurements:, time_zone:, stream_id:)
      dates_to_recalculate_averages =
        measurement_datetimes_grouped_by_date(measurements, time_zone)

      dates_to_recalculate_averages.each do |date|
        updater.call(
          stream_id: stream_id,
          time_with_time_zone: date.in_time_zone(time_zone),
        )
      end
    end

    private

    attr_reader :updater

    # Due to our custom logic 00:00:00 is considered as the end of the previous day.
    def measurement_datetimes_grouped_by_date(measurements, time_zone)
      measurements
        .map { |m| m.time_with_time_zone.in_time_zone(time_zone) }
        .group_by do |datetime|
          if datetime.hour == 0 && datetime.min == 0 && datetime.sec == 0
            datetime.to_date.prev_day
          else
            datetime.to_date
          end
        end
        .keys
    end
  end
end
