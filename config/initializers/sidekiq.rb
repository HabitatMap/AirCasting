Sidekiq.configure_server do |config|
  config.failures_max_count = 10000
end
