# config valid only for current version of Capistrano
lock '3.16.0'

set :application, 'aircasting'
set :repo_url, 'git@github.com:HabitatMap/AirCasting.git'

set :deploy_via, :remote_cache
set :ssh_options, { forward_agent: true }

set :whenever_identifier, -> { "#{fetch(:application)}_#{fetch(:stage)}" }
# fix problem with whenever not started during deployment
# https://github.com/javan/whenever/issues/612
set :whenever_roles, :all

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, fetch(:linked_files, []).push('config/database.yml')
set :linked_dirs,
    fetch(:linked_dirs, []).push(
      'public/assets',
      'log',
      'tmp/pids',
      'tmp/cache',
      'tmp/sockets',
      'tmp/eea',
      'public/system',
    )
set :linked_files,
    fetch(:linked_files, []).push(
      'config/database.yml',
      'config/secrets.yml',
      'config/newrelic.yml',
      'config/configuration.yml',
      'public/robots.txt',
      '.env',
    )

# Default value for linked_dirs is []
# set :linked_dirs, fetch(:linked_dirs, []).push('bin', 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets', 'vendor/bundle', 'public/system')

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

#namespace :deploy do
#
#  after :restart, :clear_cache do
#    on roles(:web), in: :groups, limit: 3, wait: 10 do
#      # Here we can do anything such as:
#      # within release_path do
#      #   execute :rake, 'cache:clear'
#      # end
#    end
#  end
#
#end
# after 'deploy:publishing', 'passenger:restart'

def processes_pids
  pids = []
  sidekiq_roles = Array(fetch(:sidekiq_role))
  sidekiq_roles.each do |role|
    next unless host.roles.include?(role)
    processes = fetch(:"#{role}_processes") || fetch(:sidekiq_processes)
    processes.times do |idx|
      post_fix = idx > 0 ? "-#{idx}" : ''
      pids.push fetch(:sidekiq_pid).gsub(/\.pid$/, "#{post_fix}.pid")
    end
  end

  pids
end

set :migration_role, :app
