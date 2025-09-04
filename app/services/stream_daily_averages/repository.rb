module StreamDailyAverages
  class Repository
    def daily_average_value(stream_id:, time_with_time_zone:)
      start_date_time = time_with_time_zone.beginning_of_day
      end_date_time = start_date_time + 1.day

      FixedMeasurement
        .where(
          'stream_id = ? AND time_with_time_zone > ? AND time_with_time_zone <= ?',
          stream_id,
          start_date_time,
          end_date_time,
        )
        .average(:value)
    end
  end
end
