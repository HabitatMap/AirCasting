class FixMissingTimezones < ActiveRecord::Migration
  MINUTES_IN_HOUR = 60
  SECONDS_IN_MINUTE = 60

  def up
    Session.transaction do
      Session.all.select {|s| !s.timezone_offset}.each do |session|
        unless session.measurements.empty?
          # Guess the timezone from the location.
          timezone_offset = (session.measurements.first.longitude / 15).to_i * MINUTES_IN_HOUR
          seconds = timezone_offset * SECONDS_IN_MINUTE

          session.measurements.each do |measurement|
            time = measurement.time + seconds if measurement.time

            measurement.update_column(:time, time)
            measurement.update_column(:timezone_offset, timezone_offset)
          end

          session.notes.each do |note|
            date = note.date + seconds if note.date

            note.update_column(:date, date)
          end

          start_time = session.start_time + seconds if session.start_time
          end_time = session.end_time + seconds if session.end_time

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
