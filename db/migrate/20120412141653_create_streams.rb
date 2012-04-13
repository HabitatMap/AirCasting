class CreateStreams < ActiveRecord::Migration
  def change
  	create_table :streams do |t|
      t.string :sensor_name
      t.string :unit_name
      t.string :measurement_type
      t.string :measurement_short_type
      t.string :unit_symbol 

      t.integer :threshold_very_low
      t.integer :threshold_low
      t.integer :threshold_medium
      t.integer :threshold_high
      t.integer :threshold_very_high

    	t.references :session 
  	end
  end
end
