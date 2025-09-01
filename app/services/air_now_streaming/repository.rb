module AirNowStreaming
  class Repository
    def air_now_streams
      Stream
        .includes(:session, :threshold_set)
        .joins(session: :user)
        .where(users: { username: air_now_username })
    end

    private

    def air_now_username
      'US EPA AirNow'
    end
  end
end
