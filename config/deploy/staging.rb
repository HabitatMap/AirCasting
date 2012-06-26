$:.unshift(File.expand_path('./lib', ENV['rvm_path']))
require "rvm/capistrano"
set :rvm_ruby_string, '1.9.2'

set :domain, "aircasting.llpdemo.com"
set :branch, ENV["REV"] || ENV["REF"] || ENV["BRANCH"] || ENV["TAG"] || "master"
set :rails_env, "staging"
role :app, domain
role :web, domain
role :db,  domain, :primary => true
set :user, "rubydev"
set :deploy_to, "/var/www/aircasting"
set :keep_releases, 3

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path, 'tmp', 'restart.txt')}"
  end
end
