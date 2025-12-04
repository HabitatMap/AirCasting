class ChangeStreamConfigurations < ActiveRecord::Migration[7.0]
  def change
    add_column :stream_configurations, :canonical, :boolean, null: false
  end
end
