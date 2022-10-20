class AddTimezoneOffsetToThresholdAlert < ActiveRecord::Migration[6.1]
  def change
    add_column :threshold_alerts, :timezone_offset, :integer, default: 0
  end
end
