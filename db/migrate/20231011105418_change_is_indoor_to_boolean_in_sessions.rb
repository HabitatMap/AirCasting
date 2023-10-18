class ChangeIsIndoorToBooleanInSessions < ActiveRecord::Migration[6.0]
  def up
    add_column :sessions, :is_indoor_temp, :boolean

    execute <<-SQL
      UPDATE sessions SET is_indoor_temp = CASE
        WHEN is_indoor = 1 THEN true
        WHEN is_indoor = 0 THEN false
        ELSE NULL
      END
    SQL

    remove_column :sessions, :is_indoor
    rename_column :sessions, :is_indoor_temp, :is_indoor
  end

  def down
    add_column :sessions, :is_indoor_temp, :smallint

    execute <<-SQL
      UPDATE sessions SET is_indoor_temp = CASE
        WHEN is_indoor = true THEN 1
        WHEN is_indoor = false THEN 0
        ELSE NULL
      END
    SQL

    remove_column :sessions, :is_indoor
    rename_column :sessions, :is_indoor_temp, :is_indoor
  end
end
