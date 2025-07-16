module UserSessionsSyncing
  class Repository
    def sessions_by_user_id(user_id:)
      Session.where(user_id: user_id)
    end

    def sessions_by_user_and_uuids(user_id:, uuids:)
      Session.where(user_id: user_id, uuid: uuids)
    end

    def delete_sessions(user_id:, uuids:)
      sessions = sessions_by_user_and_uuids(user_id: user_id, uuids: uuids)
      streams = Stream.where(session_id: sessions.pluck(:id))
      delete_streams_with_dependencies(streams)
      delete_sessions_with_dependencies(sessions)
    end

    def deleted_sessions_by_user_and_uuids(user_id:, uuids:)
      DeletedSession.where(user_id: user_id, uuid: uuids)
    end

    def create_deleted_sessions(user_id:, uuids:)
      existing_deleted_sessions =
        deleted_sessions_by_user_and_uuids(user_id: user_id, uuids: uuids)
          .pluck(:uuid)
      to_create_uuids = uuids - existing_deleted_sessions

      deleted_sessions =
        to_create_uuids.map do |uuid|
          DeletedSession.new(uuid: uuid, user_id: user_id)
        end

      DeletedSession.import(deleted_sessions)
    end

    private

    def delete_streams_with_dependencies(streams)
      streams.update_all(last_hourly_average_id: nil)
      stream_ids = streams.pluck(:id)
      StreamHourlyAverage.where(stream_id: stream_ids).delete_all
      StreamDailyAverage.where(stream_id: stream_ids).delete_all
      ThresholdAlert.where(stream_id: stream_ids).delete_all
      Measurement.where(stream_id: stream_ids).delete_all
      FixedMeasurement.where(stream_id: stream_ids).delete_all

      streams.delete_all
    end

    def delete_sessions_with_dependencies(sessions)
      Note.where(session_id: sessions.pluck(:id)).delete_all

      sessions.delete_all
    end
  end
end
