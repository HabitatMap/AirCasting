class AirNow::CacheManager
  def call(measurements_data)
    data_to_import = ""

    measurements_data.each do |hourly_data|
      cache_key = create_cache_key(hourly_data)
      previously_cached_aqsids = cached_aqsids(cache_key)
      cache_current_aqsids(hourly_data, cache_key)

      if previously_cached_aqsids.present?
        hourly_data = substract_already_saved_data(hourly_data, previously_cached_aqsids).join("\n").to_s
      end

      data_to_import.concat(hourly_data)
    end

    # only for logging purposes - delete before merge

    measurement_count = data_to_import.split("\n").count
    Sidekiq.logger.info "AirNow: Imported data for #{cache_key}, added #{measurements_count} measurements."

    # end of logging

    data_to_import
  end

  def create_cache_key(hourly_data)
    first_line = hourly_data.split("\n").first
    date = first_line.split('|')[0]
    utc_time = first_line.split('|')[1]
    "air_now_#{date}_#{utc_time}"
  end

  def cache_current_aqsids(hourly_data, cache_key)
    aqsids = hourly_data.split("\n").map { |line| line.split('|')[2] }
    Rails.cache.write(cache_key, aqsids, expires_in: 25.hours)
  end

  def cached_aqsids(cache_key)
    Rails.cache.read(cache_key)
  end

  def substract_saved_data(hourly_data, saved_measurements_aqsids)
    hourly_data.split("\n").reject { |line| saved_measurements_aqsids.include?(line.split('|')[2]) }
  end
end
