# DOCS:
# https://github.com/seuros/capistrano-sidekiq/issues/147
#
#
# Production server uses RVM
# require 'capistrano/rbenv'
# require 'capistrano3/unicorn'

# Simple Role Syntax
# ==================
# Supports bulk-adding hosts to roles, the primary server in each group
# is considered to be the first unless any hosts have the primary
# property set.  Don't declare `role :all`, it's a meta role.

# role :app, %w{deploy@example.com}
# role :web, %w{deploy@example.com}
# role :db,  %w{deploy@example.com}

# Extended Server Syntax
# ======================
# This can be used to drop a more detailed server definition into the
# server list. The second argument is a, or duck-types, Hash and is
# used to set extended properties on the server.

server ENV.fetch('SERVER', 'aircasting.habitatmap.org'),
       user: 'aircasting',
       roles: %w[web app]
# Default deploy_to directory is /var/www/my_app_name
set :deploy_to, '/home/aircasting/application'
set :rails_env, 'production'

set :branch, ENV.fetch('BRANCH', 'master')
set :keep_releases, 3

set :rbenv_type, :system
ruby_version =
  File.read(File.join(File.dirname(__FILE__), '..', '..', '.ruby-version'))
    .chomp
set :rbenv_ruby, ruby_version
#set :default_env, { path: "~/.rbenv/shims:~/.rbenv/bin:$PATH" }
#set :rbenv_prefix, "RBENV_ROOT=#{fetch(:rbenv_path)} RBENV_VERSION=#{fetch(:rbenv_ruby)} #{fetch(:rbenv_path)}/bin/rbenv exec"

set :default_env,
    {
      path:
        '/usr/local/rbenv/plugins/ruby-build/bin:/usr/local/rbenv/shims:/usr/local/rbenv/bin:$PATH',
      rbenv_root: '/usr/local/rbenv'
    }
set :rbenv_roles, :all
set :rbenv_ruby_dir, "/usr/local/rbenv/versions/#{ruby_version}"
set :rbenv_custom_path, '/usr/local/rbenv'
set :rbenv_path, '/usr/local/rbenv'

# Ensure this is matches /etc/init.d/sidekiq
# and config/sidekiq.yml
set :rbenv_prefix,
    "RBENV_ROOT=#{fetch(:rbenv_path)} RBENV_VERSION=#{fetch(:rbenv_ruby)} #{
      fetch(:rbenv_path)
    }/bin/rbenv exec"
set :rbenv_map_bins, %w[rake gem bundle ruby rails sidekiq sidekiqctl]
#set :sidekiq_pid,     File.join(shared_path, 'pids', 'sidekiq.pid')
#set :sidekiq_log,     File.join(shared_path, 'log', 'sidekiq.log')
#set :sidekiq_config,  File.join(shared_path, 'config', 'sidekiq.yml')
#set :unicorn_rack_env, -> { fetch(:rails_env) }
#set :unicorn_config_path, -> { File.join(release_path, "config/unicorn.rb") }
#set :unicorn_pid, -> { File.join(current_path, "pids/unicorn.pid") }

namespace :deploy do
  task :restart_app_server do
    on roles(:web), in: :groups, limit: 3, wait: 10 do
      execute "sudo systemctl restart #{fetch(:application)}"
    end
  end
end

namespace :deploy do
  task :restart_sidekiq do
    on roles(:web), in: :groups, limit: 3, wait: 10 do
      execute 'sudo systemctl restart sidekiq'
    end
  end
end

after 'deploy:published', 'deploy:restart_app_server'
after 'deploy:published', 'deploy:restart_sidekiq'

# Custom SSH Options
# ==================
# You may pass any option but keep in mind that net/ssh understands a
# limited set of options, consult[net/ssh documentation](http://net-ssh.github.io/net-ssh/classes/Net/SSH.html#method-c-start).
#
# Global options
# --------------
#  set :ssh_options, {
#    keys: %w(/home/rlisowski/.ssh/id_rsa),
#    forward_agent: false,
#    auth_methods: %w(password)
#  }
#
# And/or per server (overrides global)
# ------------------------------------
# server 'example.com',
#   user: 'user_name',
#   roles: %w{web app},
#   ssh_options: {
#     user: 'user_name', # overrides user setting above
#     keys: %w(/home/user_name/.ssh/id_rsa),
#     forward_agent: false,
#     auth_methods: %w(publickey password)
#     # password: 'please use keys'
#   }
