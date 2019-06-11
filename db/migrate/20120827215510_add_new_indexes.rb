class AddNewIndexes < ActiveRecord::Migration[4.2]
  def up
    add_index :measurements, %i[longitude latitude]
    add_index :measurements, :stream_id
    add_index :notes, :session_id
    add_index :tags, :name
    add_index :sessions, :contribute
  end

  def down
    remove_index :measurements, %i[longitude latitude]
    remove_index :measurements, :stream_id
    remove_index :notes, :session_id
    remove_index :tags, :name
    remove_index :sessions, :contribute
  end
end
