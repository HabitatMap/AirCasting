class CreateSources < ActiveRecord::Migration[7.0]
  def change
    create_table :sources do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :sources, :name, unique: true
  end
end
