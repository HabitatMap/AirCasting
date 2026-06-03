Sentry.init do |config|
  config.dsn = A9n.sentry_be_dsn
  config.environment = A9n.sentry_env
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.enabled_environments = %w[production staging experimental]

  config.send_default_pii = false
  config.traces_sample_rate = 0.0

  # Only send events from explicit BinaryProtocol::Monitor calls.
  # Keeps volume within Sentry free plan limits.
  config.before_send = lambda do |event, _hint|
    event if event.tags&.dig(:source) == 'binary_protocol'
  end
end
