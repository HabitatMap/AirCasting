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

  desc "Calculate stream bounding box and average value"
  task :calc_stream_bbox_and_average_value => :environment do
    Stream.find_each do |stream|
      stream.calc_bounding_box! if stream.min_latitude.nil?
      stream.calc_average_value! if stream.average_value.nil?
    end
  end
end
