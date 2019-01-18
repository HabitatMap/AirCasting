Geocoder.configure(
  api_key:              Rails.application.secrets.google_maps_api_key,
  use_https:            true,
  logger:               :kernel,
  kernel_logger_level:  ::Logger::INFO,
  units: :mi
)
