module UserSessionsSyncing
  class Repository
    def streams_by_session_ids(session_ids:)
      Stream.where(session_id: session_ids)
    end

    def nullify_last_hourly_average(streams:)
      streams.update_all(last_hourly_average_id: nil)
    end

    def delete_sessions(sessions:)
      sessions.delete_all
    end

    def delete_streams(streams:)
      streams.delete_all
    end

    def delete_notes(session_ids:)
      Note.where(session_id: session_ids).delete_all
    end

    def delete_stream_hourly_averages(stream_ids:)
      StreamHourlyAverage.where(stream_id: stream_ids).delete_all
    end

    def delete_stream_daily_averages(stream_ids:)
      StreamDailyAverage.where(stream_id: stream_ids).delete_all
    end

    def delete_threshold_alerts(stream_ids:)
      ThresholdAlert.where(stream_id: stream_ids).delete_all
    end

    def delete_measurements(stream_ids:)
      Measurement.where(stream_id: stream_ids).delete_all
    end
  end
end
