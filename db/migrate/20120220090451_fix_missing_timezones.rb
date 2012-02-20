class FixMissingTimezones < ActiveRecord::Migration
  MINUTES_IN_HOUR = 60
  SECONDS_IN_MINUTE = 60

  def up
    Session.transaction do
      Session.all.select {|s| !s.timezone_offset}.each do |session|
        unless session.measurements.empty?
          # Guess the timezone from the location.
          timezone_offset = (session.measurements.first.longitude / 15).to_i * MINUTES_IN_HOUR

          session.measurements.each do |measurement|
            time = measurement.time - timezone_offset * SECONDS_IN_MINUTE if measurement.time

            measurement.update_column(:time, time)
            measurement.update_column(:timezone_offset, timezone_offset)
          end

          start_time = session.start_time - timezone_offset * SECONDS_IN_MINUTE if session.start_time
          end_time = session.end_time - timezone_offset * SECONDS_IN_MINUTE if session.end_time

          session.update_column(:start_time, start_time)
          session.update_column(:end_time, end_time)
          session.update_column(:timezone_offset, timezone_offset)
        end
      end
    end
  end

  def down
  end
end
