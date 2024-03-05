module StreamDailyAverages
  class StreamInteractor
    def initialize(updater: Updater.new)
      @updater = updater
    end

    def call(stream_id:, time_zone:)
      if first_hour_of_the_day?(time_zone)
        update_value_for_previous_day(stream_id, time_zone)
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

    def beginning_of_current_day(time_zone)
      @beginning_of_current_day ||= current_time(time_zone).beginning_of_day
    end

    def update_value_for_previous_day(stream_id, time_zone)
      beginning_of_previous_day = beginning_of_current_day(time_zone) - 1.day

      updater.call(
        stream_id: stream_id,
        beginning_of_day: beginning_of_previous_day,
      )
    end

    def update_value_for_current_day(stream_id, time_zone)
      updater.call(
        stream_id: stream_id,
        beginning_of_day: beginning_of_current_day(time_zone),
      )
    end
  end
end
