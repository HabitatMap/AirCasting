class AddLocationToSessions < ActiveRecord::Migration
  def change
    add_column :sessions, :is_indoor, :boolean
    add_column :sessions, :latitude, :decimal, precision: 12, scale: 9
    add_column :sessions, :longitude, :decimal, precision: 12, scale: 9
  end
end
