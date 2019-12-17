class SetDefaultCalibration < ActiveRecord::Migration[4.2]
  def up
    Session.update_all(calibration: 80)
  end

  def down; end
end
