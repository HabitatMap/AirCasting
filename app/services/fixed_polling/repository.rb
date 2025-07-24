module FixedPolling
  class Repository
    def session(uuid:)
      FixedSession.includes(streams: :threshold_set).find_by(uuid: uuid)
    end

    def tag_list(session:)
      session.tag_list
    end

    def measurements_grouped_by_stream_id(stream_ids:, since:)
      Measurement
        .unscoped
        .where(stream_id: stream_ids)
        .where('time > ?', since)
        .group_by(&:stream_id)
    end
  end
end
