module StreamHourlyAverages
  class Updater
    def call
      beginning_of_hour, end_of_hour = calculate_time_range

      values = fetch_average_values(beginning_of_hour, end_of_hour)
      insert_values(values)
    end

    private

    def calculate_time_range
      beginning_of_hour = Time.current.beginning_of_hour - 1.hour
      end_of_hour = beginning_of_hour.end_of_hour

      [beginning_of_hour, end_of_hour]
    end

    def fetch_average_values(beginning_of_hour, end_of_hour)
      Measurement
        .unscoped
        .joins(stream: :session)
        .where(time_with_time_zone: beginning_of_hour..end_of_hour)
        .where(sessions: { type: 'FixedSession' })
        .where.not(sessions: { user_id: airnow_user.id })
        .group(:stream_id)
        .average(:value)
        .map { |stream_id, value| { stream_id: stream_id, value: value.round } }
    end

    def insert_values(values)
      StreamHourlyAverage
        .create_with(datetime: Time.current.beginning_of_hour)
        .insert_all(
          values,
          unique_by: %i[stream_id datetime],
          record_timestamps: true,
        )
    end

    # That's a temporary solution until we have stream_configuration in place to store information about sensor type
    def airnow_user
      User.find_by!(username: 'US EPA AirNow')
    end
  end
end
