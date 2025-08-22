module AirNowStreaming
  class Repository
    def air_now_user
      User.find_by!(username: air_now_username)
    end

    def air_now_sessions
      sessions =
        Session
          .includes(streams: :threshold_set)
          .joins(:user)
          .where(users: { username: air_now_username })
    end

    private

    def air_now_username
      'US EPA AirNow'
    end
  end
end
