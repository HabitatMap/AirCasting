class RemoveFieldsFromNotes < ActiveRecord::Migration[7.0]
  def change
    remove_column :notes, :photo_file_name, :string
    remove_column :notes, :photo_content_type, :string
    remove_column :notes, :photo_file_size, :integer
    remove_column :notes, :photo_updated_at, :datetime
  end
end
