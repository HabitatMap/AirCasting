Geocoder.configure(
  api_key:              Rails.application.config.secrets.fetch('GOOGLE_MAPS_API_KEY'),
  use_https:            true,
  logger:               :kernel,
  kernel_logger_level:  ::Logger::INFO,
  units: :mi
)
