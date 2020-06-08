# Use this file to easily define all of your cron jobs.
#
# It's helpful, but not entirely necessary to understand cron before proceeding.
# http://en.wikipedia.org/wiki/Cron

# Example:
#
# set :output, "/path/to/my/cron_log.log"
#
# every 2.hours do
#   command "/usr/bin/some_great_command"
#   runner "MyModel.some_method"
#   rake "some:great:rake:task"
# end
#
# every 4.days do
#   runner "AnotherModel.prune_old_records"
# end

# Learn more: http://github.com/javan/whenever

# Heaviest app usage is from the US and Western Europe so let's have the daily sidekiq restart at:
# 6:00 AM UTC is:
# 2:00 AM in EST
# 11:00 PM in PST
every 1.day, at: '6:00 am', roles: %i[web] do
  # restart sidekiq every day to save RAM
  # because sidekiq can take over 7GB RAM when not restarted for long time
  command 'sudo systemctl restart sidekiq'
end
