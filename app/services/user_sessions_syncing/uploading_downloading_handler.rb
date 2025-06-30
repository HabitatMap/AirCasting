module UserSessionsSyncing
  class UploadingDownloadingHandler
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(sessions_from_mobile_app:, user_id:)
      db_sessions_hash = fetch_and_parse_db_sessions(user_id)
      mobile_app_sessions_hash =
        parse_mobile_app_sessions(sessions_from_mobile_app)

      [
        to_upload_uuids(db_sessions_hash, mobile_app_sessions_hash),
        to_download_uuids(db_sessions_hash, mobile_app_sessions_hash),
      ]
    end

    private

    attr_reader :repository

    def fetch_and_parse_db_sessions(user_id)
      repository
        .sessions_by_user_id(user_id: user_id)
        .pluck(:uuid, :version)
        .to_h
    end

    def parse_mobile_app_sessions(sessions_from_mobile_app)
      sessions_from_mobile_app.map do |session|
        [session[:uuid], session[:version]]
      end.to_h
    end

    def to_upload_uuids(db_sessions_hash, mobile_app_sessions_hash)
      mobile_app_sessions_hash.keys - db_sessions_hash.keys
    end

    def to_download_uuids(db_sessions_hash, mobile_app_sessions_hash)
      outdated_uuids =
        identify_outdated_uuids(db_sessions_hash, mobile_app_sessions_hash)

      db_sessions_hash.keys - mobile_app_sessions_hash.keys + outdated_uuids
    end

    def identify_outdated_uuids(db_sessions_hash, mobile_app_sessions_hash)
      uuids_to_check = db_sessions_hash.keys & mobile_app_sessions_hash.keys

      outdated_uuids = []
      uuids_to_check.each do |uuid|
        if db_sessions_hash[uuid] > mobile_app_sessions_hash[uuid]
          outdated_uuids << uuid
        end
      end

      outdated_uuids
    end
  end
end
