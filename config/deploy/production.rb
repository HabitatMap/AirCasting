set :rvm_path,     "/usr/local/rvm"
set :rvm_bin_path, "#{rvm_path}/bin"
set :rvm_lib_path, "#{rvm_path}/lib"

set :deploy_to, "/var/www/aircasting"
set :rails_env, "production"
set :host, "aircasting.org"
set :user, "rubydev"
set :rvm_ruby_string, "2.0.0-p647"

server "aircasting.org", :app, :web, :db, :primary => true
set :branch, "master"
set :keep_releases, 3

set :application, "aircasting"
set :bundle_dir, File.join(fetch(:shared_path), 'bundle')

namespace :deploy do
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path, 'tmp', 'restart.txt')}"
  end
end
