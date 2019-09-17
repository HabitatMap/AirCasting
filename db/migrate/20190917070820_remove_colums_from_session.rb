class RemoveColumsFromSession < ActiveRecord::Migration[5.2]
  def change
    if column_exists?(:sessions, :timezone_offset)
      remove_column :sessions, :timezone_offset
    end
    if column_exists?(:sessions, :os_version)
      remove_column :sessions, :os_version
    end
    if column_exists?(:sessions, :phone_model)
      remove_column :sessions, :phone_model
    end
    if column_exists?(:sessions, :description)
      remove_column :sessions, :description
    end
    if column_exists?(:sessions, :offset_60_db)
      remove_column :sessions, :offset_60_db
    end
    if column_exists?(:sessions, :calibration)
      remove_column :sessions, :calibration
    end
  end
end
