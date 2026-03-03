return if Rails.env.test?

Coverband.configure do |config|
  # Use a dedicated Redis DB (db 3) to avoid key collisions with Sidekiq (db 0)
  # and ActionCable (db 0). Override via COVERBAND_REDIS_URL on the server if needed.
  config.store = Coverband::Adapters::RedisStore.new(
    Redis.new(url: ENV.fetch('COVERBAND_REDIS_URL', 'redis://127.0.0.1:6379/3'))
  )

  # Track "was this line ever called" rather than call counts.
  # Available in Ruby 2.6+. Significantly lower overhead than default coverage
  # and sufficient for dead code / unused controller action detection.
  config.use_oneshot_lines_coverage = true

  # Flush coverage data to Redis asynchronously every 5 minutes.
  # Per-request overhead is near zero — the background thread does the Redis I/O.
  # With Unicorn + unicorn-worker-killer, a worker being recycled can lose at most
  # 5 minutes of coverage data for that one process — acceptable for long-running analysis.
  config.background_reporting_enabled = true
  config.background_reporting_sleep_seconds = 300

  # Track route hits separately. Shows which routes (controller#action pairs)
  # are actually called in production — the primary goal here.
  config.track_routes = true

  # Only report coverage from app code; skip gems, tests, config, generated files.
  config.ignore += %w[
    vendor
    spec
    config
    db
    bin
    lib/tasks
    lib/assets
    public
  ]

  config.logger = Rails.logger
end
