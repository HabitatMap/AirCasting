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

  desc "Recalculate stream bounding box and average value"
  task :calculate_stream_bounding_box_and_average_value => :environment do
    streams_repository = StreamsRepository.new
    Stream.mobile.find_each do |stream|
      streams_repository.calculate_bounding_box!(stream)
      streams_repository.calculate_average_value!(stream)
    end
  end

  desc "Recalculate stream bounding box"
  task :calculate_stream_bounding_box => :environment do
    streams_repository = StreamsRepository.new
    Stream.find_each do |stream|
      streams_repository.calculate_bounding_box!(stream)
      print "."
    end
  end

  desc "Remove space divided tags"
  task :remove_space_divided_tags => :environment do
    num = Session.connection.execute("SELECT * FROM tags WHERE name LIKE '% %'").size
    puts "removing #{num} tags"
    Session.connection.execute("DELETE FROM tags WHERE name LIKE '% %'")
  end

  desc 'Chomp username\'s attributes'
  task :chomp_username => :environment do
    User.all.each do |user|
      user.username_will_change! && user.username.chomp! && user.save
    end
  end

  desc "Destroy empty streams"
  task :destroy_empty_streams => :environment do
    ActiveRecord::Base.transaction do
      sql = <<~END
        SELECT s.id FROM streams s
        INNER JOIN sessions ss ON ss.id = s.session_id
        WHERE NOT EXISTS (SELECT m.id FROM measurements m WHERE s.id = m.stream_id)
        AND ss.created_at < DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        AND ss.updated_at < DATE_SUB(CURDATE(), INTERVAL 3 DAY);
      END
      ids = Stream.find_by_sql(sql).map(&:id)
      puts "Destroying #{ids.size} streams"

      Stream.where(id: ids).each do |stream|
        puts "Destroying #{stream.inspect}"
        stream.destroy!
      end
    end
  end

  desc "Average long mobile streams"
  task :average_long_mobile_streams => :environment do
    AverageStreams.new(logger: ActiveSupport::Logger.new(STDOUT)).call
  end

  desc "Set average_value for fixed streams to their last measurement value"
  task :recalculate_average_value_for_fixed_streams => :environment do
    Stream.fixed.find_each do |stream|
      stream.update!(average_value: stream.measurements.order('time ASC').last&.value)
      putc '.'
    end
  end
end
