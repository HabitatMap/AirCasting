namespace :cache do
  desc "Migrate cache from FileStore to Redis"
  task migrate_to_redis: :environment do
    old_cache_store = ActiveSupport::Cache::FileStore.new(Rails.root.join('tmp', 'cache'))

    old_cache_store.instance_variable_get(:@data).each do |key, value|
      old_value = old_cache_store.read(key)

      if old_value.is_a?(Hash) && old_value[:expires_at]
        cache_expiry_time = old_value[:expires_at] - Time.now
        Rails.cache.write(key, old_value[:data], expires_in: cache_expiry_time) if cache_expiry_time > 0
      else
        Rails.cache.write(key, old_value)
      end
    end

    puts "Cache migration completed!"
  end
end
