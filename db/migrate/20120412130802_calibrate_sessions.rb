class CalibrateSessions < ActiveRecord::Migration[4.2]
  CALIBRATE =
    '(value + (calibration - 60 + offset_60_db)) / (calibration - 60 + offset_60_db) * (calibration - 60) + 60'

  def up
    execute <<-SQL
      UPDATE measurements m
      SET value = #{CALIBRATE}
      FROM sessions s
      WHERE s.id = m.session_id
    SQL
  end

  def down; end
end
