class RemoveThresholdsFromStreams < ActiveRecord::Migration[6.1]
  def change
      remove_column :streams, :threshold_very_low, :integer
      remove_column :streams, :threshold_low, :integer
      remove_column :streams, :threshold_medium, :integer
      remove_column :streams, :threshold_high, :integer
      remove_column :streams, :threshold_very_high, :integer
  end
end
