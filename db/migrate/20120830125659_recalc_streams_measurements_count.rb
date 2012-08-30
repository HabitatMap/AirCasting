class RecalcStreamsMeasurementsCount < ActiveRecord::Migration
  def up
    Stream.find_each do |stream|
      Stream.reset_counters(stream.id, :measurements)
    end
  end

  def down
  end
end
