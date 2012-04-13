class MigrateMesasurementsToStreams < ActiveRecord::Migration

  def up
  	change_table :measurements do |t|
  		t.references :stream
  	end

  	Session.find_each do |session|
  		stream = Stream.create(
       :sensor_name => "Phone Microphone",
       :unit_name => "decibels",
       :measurement_type => "Sound Level",
       :measurement_short_type => "dB",
       :unit_symbol => "dB",
       :threshold_very_low => 20, 
       :threshold_low => 60,
       :threshold_medium => 70,
       :threshold_high => 80,
       :threshold_very_high => 100,
       :session => session,
			)

  		execute "UPDATE measurements SET stream_id = #{stream.id} WHERE session_id = #{session.id}"
  	end

  	change_table :measurements do |t|
 			t.remove_references :session
 		end
  end

  def down
  end
end
