module UserSessionsSyncing
  class Deleter
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(sessions:)
      streams =
        repository.streams_by_session_ids(session_ids: sessions.pluck(:id))

      ActiveRecord::Base.transaction do
        delete_streams_dependencies(streams)
        delete_sessions_dependencies(sessions)
        repository.delete_streams(streams: streams)
        repository.delete_sessions(sessions: sessions)
      end
    end

    private

    attr_reader :repository

    def delete_streams_dependencies(streams)
      repository.nullify_last_hourly_average(streams: streams)
      stream_ids = streams.pluck(:id)
      repository.delete_stream_hourly_averages(stream_ids: stream_ids)
      repository.delete_stream_daily_averages(stream_ids: stream_ids)
      repository.delete_threshold_alerts(stream_ids: stream_ids)
      repository.delete_measurements(stream_ids: stream_ids)
    end

    def delete_sessions_dependencies(sessions)
      repository.delete_notes(session_ids: sessions.pluck(:id))
    end
  end
end
