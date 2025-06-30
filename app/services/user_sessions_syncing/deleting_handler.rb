module UserSessionsSyncing
  class DeletingHandler
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(sessions_from_mobile_app:, user_id:)
      deleted_uuids = delete_sessions(sessions_from_mobile_app, user_id)
      create_deleted_sessions(user_id, deleted_uuids)

      deleted_session_uuids(sessions_from_mobile_app, user_id)
    end

    private

    attr_reader :repository

    def delete_sessions(sessions_from_mobile_app, user_id)
      uuids_to_delete =
        sessions_from_mobile_app.select { |s| s[:deleted] }.pluck(:uuid)
      repository.delete_sessions(user_id: user_id, uuids: uuids_to_delete)

      uuids_to_delete
    end

    def create_deleted_sessions(user_id, deleted_uuids)
      repository.create_deleted_sessions(user_id: user_id, uuids: deleted_uuids)
    end

    def deleted_session_uuids(sessions_from_mobile_app, user_id)
      repository
        .deleted_sessions_by_user_and_uuids(
          user_id: user_id,
          uuids: sessions_from_mobile_app.pluck(:uuid),
        )
        .pluck(:uuid)
    end
  end
end
