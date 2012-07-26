require 'session_local_time_updater'

namespace :fix do
  task :ensure_start_time_end_time_in_sessions => [:environment] do

  end

  desc "Add local time to sessions"
  task :add_local_time_to_session => [:environment] do
    Session.find_in_batches do |group|
      group.each do |s|
        SessionLocalTimeUpdater.update(s)
      end
    end
  end
end

