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

  desc "Set default sensor_package_name where it is missing"
  task :set_default_sensor_package_name => :environment do
    Stream.find_each do |stream|
      if stream.sensor_package_name.blank?
        stream.sensor_package_name = 'Builtin'
        stream.save!
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

  desc "Remove space divided tags"
  task :remove_space_divided_tags => :environment do
    num = Session.connection.execute("SELECT * FROM tags WHERE name LIKE '% %'").size
    puts "removing #{num} tags"
    Session.connection.execute("DELETE FROM tags WHERE name LIKE '% %'")
  end

end
