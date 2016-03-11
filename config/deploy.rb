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
require 'new_relic/recipes'

set :application, "aircasting"
set :repository, "git@github.com:HabitatMap/AirCasting.git"
set :scm, :git
set :deploy_via, :remote_cache
set :copy_exclude, [ ".git" ]
set :use_sudo, false
set :stages, %w(staging production)
set :default_stage, "staging"
set :rvm_ruby_string, "2.0.0"
set :rvm_type, :system
set :ssh_options, { :forward_agent => true }

before "deploy:assets:precompile" do
  run "ln -nfs #{shared_path}/config/database.yml #{release_path}/config/database.yml"
  run "ln -nfs #{shared_path}/config/unicorn.rb #{release_path}/config/unicorn.rb"
  run "ln -nfs #{shared_path}/newrelic.yml #{release_path}/config/newrelic.yml"
  run "ln -nfs #{shared_path}/config/honeybadger.yml #{release_path}/config/honeybadger.yml"
  run "ln -nfs #{shared_path}/.rvmrc #{release_path}/.rvmrc"
end

after "deploy:update_code", "deploy:migrate"
after 'deploy:restart', 'deploy:cleanup'
after 'deploy:restart', 'newrelic:notice_deployment'
