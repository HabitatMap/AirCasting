module StreamDailyAverages
  class StreamInteractor
    def initialize(updater: Updater.new)
      @updater = updater
    end

    def call(stream_id:, time_zone:, is_air_now_stream:)
      if first_hour_of_the_day?(time_zone)
        recalucate_daily_values(stream_id, time_zone, is_air_now_stream)
      end

      update_value_for_current_day(stream_id, time_zone)
    end

    private

    attr_reader :updater

    def current_time(time_zone)
      @current_time ||= Time.current.in_time_zone(time_zone)
    end

    def first_hour_of_the_day?(time_zone)
      current_time(time_zone).hour < 1
    end

    def recalucate_daily_values(stream_id, time_zone, is_air_now_stream)
      updater.call(
        stream_id: stream_id,
        time_with_time_zone: current_time(time_zone) - 1.day,
      )

      if is_air_now_stream
        updater.call(
          stream_id: stream_id,
          time_with_time_zone: current_time(time_zone) - 2.days,
        )
      end
    end

    def update_value_for_current_day(stream_id, time_zone)
      updater.call(
        stream_id: stream_id,
        time_with_time_zone: current_time(time_zone),
      )
    end
  end
end
