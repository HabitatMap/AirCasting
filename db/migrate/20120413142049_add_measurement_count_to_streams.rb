class AddMeasurementCountToStreams < ActiveRecord::Migration
  def change
    add_column :streams, :measurements_count, :Integer
  end
end
