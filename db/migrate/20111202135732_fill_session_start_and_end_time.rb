class FillSessionStartAndEndTime < ActiveRecord::Migration[4.2]
  def up
    execute 'UPDATE sessions s SET start_time=(SELECT MIN(time) FROM measurements WHERE session_id=s.id), end_time=(SELECT MAX(time) FROM measurements WHERE session_id=s.id)'
  end

  def down; end
end
