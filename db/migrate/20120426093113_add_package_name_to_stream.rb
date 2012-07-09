class AddPackageNameToStream < ActiveRecord::Migration
  def change
    change_table :measurements do |t|
      t.references :stream
    end rescue nil

    add_column :streams, :sensor_package_name, :text rescue nil
    add_column :streams, :measurements_count, :integer rescue nil

    Session.find_each do |session|
      stream = Stream.new(
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
        :sensor_package_name => "Builtin"
      )
      stream.save!
      execute "UPDATE measurements SET stream_id = #{stream.id} WHERE session_id = #{session.id}"
    end

    change_table :measurements do |t|
      t.remove_references :session
    end
  end
end
