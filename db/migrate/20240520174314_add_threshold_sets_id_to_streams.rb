class AddThresholdSetsIdToStreams < ActiveRecord::Migration[6.1]
  def change
    add_column :streams, :threshold_set_id, :integer
    add_index :streams, :threshold_set_id
    add_foreign_key :streams, :threshold_sets, column: :threshold_set_id
  end
end
