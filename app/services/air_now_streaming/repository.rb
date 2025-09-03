module AirNowStreaming
  class Repository
    def air_now_user
      User.find_by!(username: air_now_username)
    end

    def air_now_streams
      Stream
        .includes(:session, :threshold_set)
        .joins(session: :user)
        .where(users: { username: air_now_username })
    end

    def air_now_threshold_sets
      ThresholdSet.where(
        sensor_name: %w[Government-PM2.5 Government-NO2 Government-Ozone],
      )
    end

    def update_sessions_end_timestamps(session_rows:)
      Session.upsert_all(session_rows, unique_by: :id) if session_rows.any?
    end

    def import_sessions(sessions:)
      Session.import(sessions)
    end

    def import_streams(streams:)
      Stream.import(streams)
    end

    def import_fixed_measurements(fixed_measurements:)
      FixedMeasurement.import(fixed_measurements, on_duplicate_key_ignore: true)
    end

    private

    def air_now_username
      'US EPA AirNow'
    end
  end
end
