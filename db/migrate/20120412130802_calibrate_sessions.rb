class CalibrateSessions < ActiveRecord::Migration
  CALIBRATE = "(value + (calibration - 60 + offset_60_db)) / (calibration - 60 + offset_60_db) * (calibration - 60) + 60"

  def up
  	execute <<-SQL
 			update measurements m
 			LEFT JOIN sessions s on s.id = m.session_id
 			set value = #{CALIBRATE}
 		SQL
  end

  def down
  end
end
