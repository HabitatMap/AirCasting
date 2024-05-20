class AddThresholdSetsIdToStreams < ActiveRecord::Migration[6.1]
  def change
    add_column :streams, :threshold_set_id, :integer
  end
end
