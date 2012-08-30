class AddDefaultToStreamsMeasurementsCount < ActiveRecord::Migration
  def change
    change_column :streams, :measurements_count, :integer, :null => false, :default => 0
  end
end
