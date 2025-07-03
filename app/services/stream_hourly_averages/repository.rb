module StreamHourlyAverages
  class Repository
    def insert_stream_hourly_averages(start_date_time:, end_date_time:)
      stream_ids_and_values_to_insert =
        hourly_average_values_for_fixed_streams(start_date_time, end_date_time)

      if stream_ids_and_values_to_insert.any?
        insert_records(stream_ids_and_values_to_insert, end_date_time)
      end
    end

    def update_streams_last_hourly_average_ids(date_time:)
      stream_ids_with_last_hourly_average_ids =
        StreamHourlyAverage
          .where(date_time: date_time)
          .pluck(:stream_id, :id)
          .to_h

      streams = Stream.where(id: stream_ids_with_last_hourly_average_ids.keys)

      streams.each do |stream|
        stream.update(
          last_hourly_average_id:
            stream_ids_with_last_hourly_average_ids[stream.id],
        )
      end
    end

    private

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

    def insert_records(stream_ids_and_values_to_insert, end_date_time)
      current_time = Time.current

      StreamHourlyAverage
        .create_with(
          date_time: end_date_time,
          created_at: current_time,
          updated_at: current_time,
        )
        .insert_all(
          stream_ids_and_values_to_insert,
          unique_by: %i[stream_id date_time],
        )
    end
  end
end
