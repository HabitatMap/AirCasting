require 'sidekiq-unique-jobs'

Sidekiq.configure_server do |config|
  config.redis = { url: ENV['REDIS_URL'] }
  config.failures_max_count = 2000

  config.client_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Client
  end

  config.server_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Server
  end

  config.log_formatter = Sidekiq::Logger::Formatters::JSON.new
  logfile = File.open("#{Rails.root}/log/sidekiq.log", 'a')
  logfile.sync = true
  config.logger = ActiveSupport::Logger.new(logfile, level: Logger::INFO)

  SidekiqUniqueJobs::Server.configure(config)
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV['REDIS_URL'] }

  config.client_middleware do |chain|
    chain.add SidekiqUniqueJobs::Middleware::Client
  end
end
