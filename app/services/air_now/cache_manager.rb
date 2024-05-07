# file format:
# measurements date|time|aqsid|location|timezone|parameter|unit|value|attribution

class AirNow::CacheManager
  def call(measurements_data)
    data_to_import = ""

    measurements_data.each do |hourly_data|
      cache_key = create_cache_key(hourly_data)
      previously_cached_aqsids = cached_aqsids(cache_key)
      cache_current_aqsids(hourly_data, cache_key)

      if previously_cached_aqsids.present?
        hourly_data = subtract_already_saved_data(hourly_data, previously_cached_aqsids).join("\n").to_s
      end

      data_to_import.concat(hourly_data)

      # logging into /home/aircasting/application/current/log/sidekiq.log delete before merging
      log(hourly_data, cache_key)
    end

    data_to_import
  end

  private

  def create_cache_key(hourly_data)
    date, utc_time = hourly_data.split("\n").first.split('|').values_at(0, 1)
    "air_now_#{date}_#{utc_time}"
  end

  def cache_current_aqsids(hourly_data, cache_key)
    aqsids = hourly_data_lines(hourly_data).map { |line| aqsid_from_line(line) }
    Rails.cache.write(cache_key, aqsids, expires_in: cache_expiry_time)
  end

  def hourly_data_lines(hourly_data)
    hourly_data.split("\n")
  end

  def cached_aqsids(cache_key)
    Rails.cache.read(cache_key)
  end

  def subtract_already_saved_data(hourly_data, saved_measurements_aqsids)
    hourly_data_lines(hourly_data).reject { |line| saved_measurements_aqsids.include?(aqsid_from_line(line)) }
  end

  def aqsid_from_line(line)
    line.split('|')[2]
  end

  def cache_expiry_time
    25.hours
  end

  def log(hourly_data, cache_key)
    # delete before merging
    measurements_count = hourly_data.split("\n").count
    Sidekiq.logger.info "AirNow: Imported data for #{cache_key}, added #{measurements_count} measurements."
  end
end
