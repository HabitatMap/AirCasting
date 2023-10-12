class CreateTags < ActiveRecord::Migration[6.0] # or whatever version of Rails you're using
  def change
    create_table :tags do |t|
      t.string :name, index: true
      t.integer :taggings_count, default: 0

      t.timestamps
    end
  end
end
