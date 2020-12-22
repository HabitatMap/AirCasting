#!/usr/bin/env bash
cd /app
bin/rails db:create db:migrate
bin/rails assets:precompile
bundle exec foreman start -f Procfile.docker
