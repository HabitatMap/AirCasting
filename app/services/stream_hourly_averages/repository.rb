module StreamHourlyAverages
  class Repository
    def insert_stream_hourly_averages(start_date_time:, end_date_time:)
      values_to_insert =
        hourly_average_values_for_fixed_streams(start_date_time, end_date_time)

      insert_records(values_to_insert, end_date_time)
    end

    def update_last_hourly_average(values)
      values.each do |hash|
        Stream.update(
          hash[:stream_id],
          last_hourly_average_id: hash[:last_hourly_average_id],
        )
      end
    end

    # private

    def hourly_average_values_for_fixed_streams(start_date_time, end_date_time)
      # That's a temporary solution until we have stream_configuration in place to store information about sensor type
      airnow_user = User.find_by!(username: 'US EPA AirNow')

      Measurement
        .unscoped
        .joins(stream: :session)
        .where(
          'time_with_time_zone > ? AND time_with_time_zone <= ?',
          start_date_time,
          end_date_time,
        )
        .where(sessions: { type: 'FixedSession' })
        .where.not(sessions: { user_id: airnow_user.id })
        .group(:stream_id)
        .average(:value)
        .map { |stream_id, value| { stream_id: stream_id, value: value.round } }
    end

    def insert_records(values, end_date_time)
      current_time = Time.current

      StreamHourlyAverage
        .create_with(
          datetime: end_date_time,
          created_at: current_time,
          updated_at: current_time,
        )
        .insert_all(
          values,
          returning: %i[stream_id id],
          unique_by: %i[stream_id datetime],
        )
        .rows
        .map { |row| { stream_id: row[0], last_hourly_average_id: row[1] } }
    end
  end
end
