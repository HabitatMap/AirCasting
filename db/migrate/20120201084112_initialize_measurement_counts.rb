class InitializeMeasurementCounts < ActiveRecord::Migration
  def up
    Session.all.each do |session|
      Session.update_counters(session.id, :measurements_count => session.measurements.size)
    end
  end

  def down
  end
end
