class CacheSessionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: :default

  def perform(session_type:, data:)
    redis_cache = Rails.application.config.custom_cache_stores[:redis_store]

    case session_type
    when "fixed_active"
      data = delete_filtering_params(data)
      sensor_name = data[:sensor_name]
      is_indoor = data[:is_indoor]
      cache_key = "fixed_sessions_#{sensor_name}_#{is_indoor}"

      if redis_cache.read(cache_key).nil?
        sessions = FixedSession.active.filter_(data)
        redis_cache.write(cache_key, sessions, expires_in: 5.minutes)
      end

    when "fixed_dormant"
      data = delete_filtering_params(data)
      sensor_name = data[:sensor_name]
      is_indoor = data[:is_indoor]
      cache_key = "fixed_sessions_#{sensor_name}_#{is_indoor}"

      if redis_cache.read(cache_key).nil?
        sessions = FixedSession.dormant.filter_(data)
        redis_cache.write(cache_key, sessions, expires_in: 5.minutes)
      end

    when "mobile"
      data = delete_filtering_params(data)
      cache_key = "mobile_sessions_#{sensor_name}"
      sensor_name = data[:sensor_name]

      cache_key = "mobile_sessions_#{sensor_name}"

      if redis_cache.read(cache_key).nil?
        sessions = MobileSession.with_user_and_streams.filter_(data)
        redis_cache.write(cache_key, sessions, expires_in: 5.minutes)
      end
    end
  end

  def delete_filtering_params(data)
    data.delete(:west)
    data.delete(:east)
    data.delete(:south)
    data.delete(:north)
    data.delete(:tags)
    data.delete(:usernames)
    data
  end
end
