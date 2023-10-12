class ChangeIsIndoorToBooleanInSessions < ActiveRecord::Migration[6.0]
  def up
    # Add a new temporary column
    add_column :sessions, :is_indoor_temp, :boolean

    # Copy values from is_indoor to is_indoor_temp
    execute <<-SQL
      UPDATE sessions SET is_indoor_temp = CASE
        WHEN is_indoor = 1 THEN true
        WHEN is_indoor = 0 THEN false
        ELSE NULL
      END
    SQL

    # Remove the old column
    remove_column :sessions, :is_indoor

    # Rename the temporary column to the original name
    rename_column :sessions, :is_indoor_temp, :is_indoor
  end

  def down
    # Add the old column back
    add_column :sessions, :is_indoor_temp, :smallint

    # Copy values back from is_indoor to is_indoor_temp
    execute <<-SQL
      UPDATE sessions SET is_indoor_temp = CASE
        WHEN is_indoor = true THEN 1
        WHEN is_indoor = false THEN 0
        ELSE NULL
      END
    SQL

    # Remove the boolean column
    remove_column :sessions, :is_indoor

    # Rename the temporary column back to the original name
    rename_column :sessions, :is_indoor_temp, :is_indoor
  end
end
