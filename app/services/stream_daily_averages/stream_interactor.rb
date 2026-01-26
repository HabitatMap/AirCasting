module StreamDailyAverages
  class StreamInteractor
    def initialize(updater: Updater.new)
      @updater = updater
    end

    def call(stream_id:, station_current_time:, is_gov_stream:)
      ActiveRecord::Base.transaction do
        if first_hour_of_the_day?(station_current_time)
          recalucate_daily_values(
            stream_id,
            station_current_time,
            is_gov_stream,
          )
        end

        update_value_for_current_day(stream_id, station_current_time)
      end
    end

    private

    attr_reader :updater

    def first_hour_of_the_day?(station_current_time)
      station_current_time.hour < 1
    end

    def recalucate_daily_values(stream_id, station_current_time, is_gov_stream)
      updater.call(
        stream_id: stream_id,
        time_with_time_zone: station_current_time - 1.day,
      )

      if is_gov_stream
        updater.call(
          stream_id: stream_id,
          time_with_time_zone: station_current_time - 2.days,
        )
      end
    end

    def update_value_for_current_day(stream_id, station_current_time)
      updater.call(
        stream_id: stream_id,
        time_with_time_zone: station_current_time,
      )
    end
  end
end
