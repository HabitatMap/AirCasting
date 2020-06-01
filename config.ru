# This file is used by Rack-based servers to start the application.

if Rails.env.production? || true
  # https://github.com/kzk/unicorn-worker-killer
  require 'unicorn/worker_killer'
  # Max memory size (RSS) per worker
  use Unicorn::WorkerKiller::Oom, (1536*(1024**2)), (2048*(1024**2)), 16, true
end

require ::File.expand_path('../config/environment',  __FILE__)
use Rack::Deflater
run AirCasting::Application
