require 'session_local_time_updater'

namespace :fix do
  desc "Add local time to sessions"
  task :add_local_time_to_session => [:environment] do
    Session.find_in_batches do |group|
      group.each do |s|
        SessionLocalTimeUpdater.update(s)
      end
    end
  end
end

