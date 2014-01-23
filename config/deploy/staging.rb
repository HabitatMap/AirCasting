server 'aircasting.demo.llp.pl', :app, :web, :db, primary: true
set :port, 20022
set :user, "aircasting"
set :use_sudo, false
set :deploy_to, "/home/app/aircasting"
set :keep_releases, 3
set :branch, :master
set :rails_env, "staging"
