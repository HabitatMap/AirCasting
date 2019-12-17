class DropTagsFromSessions < ActiveRecord::Migration[4.2]
  def up
    remove_column :sessions, :tags
  end

  def down
    add_column :sessions, :tags, :text
  end
end
