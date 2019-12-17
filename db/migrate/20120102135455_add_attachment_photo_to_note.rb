class AddAttachmentPhotoToNote < ActiveRecord::Migration[4.2]
  def self.up
    add_column :notes, :photo_file_name, :string
    add_column :notes, :photo_content_type, :string
    add_column :notes, :photo_file_size, :integer
    add_column :notes, :photo_updated_at, :datetime
  end

  def self.down
    remove_column :notes, :photo_file_name
    remove_column :notes, :photo_content_type
    remove_column :notes, :photo_file_size
    remove_column :notes, :photo_updated_at
  end
end
