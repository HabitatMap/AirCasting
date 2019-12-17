class AddMetadataToSessions < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :data_type, :string
    add_column :sessions, :instrument, :string
    add_column :sessions, :phone_model, :string
    add_column :sessions, :os_version, :string
  end
end
