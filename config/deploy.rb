# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# You can contact the authors by email at <info@habitatmap.org>

require "rvm/capistrano"
require 'bundler/capistrano'
require 'capistrano/ext/multistage'

set :rvm_ruby_string, '1.9.3-p327'
set :rvm_type,   :system

set :repository,  "git@github.com:HabitatMap/AirCasting.git"
set :scm, :git

set :deploy_via, :remote_cache
set :copy_exclude, [ '.git' ]
set :use_sudo, false

set :stages, %w(staging production)

set :bundle_gemfile,  "Gemfile"
set :bundle_flags,    "--deployment --quiet"
set :bundle_without,  [:development, :test]
set :bundle_cmd, "LANG='en_US.UTF-8' LC_ALL='en_US.UTF-8' bundle"

namespace :rake do
  # run like: cap staging rake:invoke task=a_certain_task
  desc "Run a task on a remote server."
  task :invoke, :roles => :db do
    run("cd #{deploy_to}/current; bundle exec rake #{ENV['task']} RAILS_ENV=#{rails_env}")
  end
end

namespace :deploy do
  desc "Symlink shared files/directories"
  task :symlink_shared do
    cmd = "ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml"
    cmd << " && ln -nfs #{shared_path}/newrelic.yml #{release_path}/config/newrelic.yml"
    cmd << " && ln -nfs #{shared_path}/.rvmrc #{release_path}/.rvmrc"
    run cmd
  end

  desc "Package assets"
  task :package_assets do
    run "cd #{release_path}; RAILS_ENV=#{rails_env} RAILS_GROUPS=assets bundle exec rake assets:precompile --trace"
  end

  desc "build missing paperclip styles"
  task :build_missing_paperclip_styles do
    run "cd #{release_path}; RAILS_ENV=#{rails_env} bundle exec rake paperclip:refresh:missing_styles"
  end
end

desc "reset counters"
task :reset_counters do
  run "cd #{current_path}; RAILS_ENV=#{rails_env} bundle exec rake sessions:reset_counters"
end

after 'deploy:update_code', 'deploy:symlink_shared'
after 'deploy:symlink_shared', 'deploy:package_assets'
after 'deploy:symlink_shared', 'deploy:build_missing_paperclip_styles'
after 'deploy:update', 'deploy:cleanup'
