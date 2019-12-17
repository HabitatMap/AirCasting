class CreateNotes < ActiveRecord::Migration[4.2]
  def change
    create_table :notes do |t|
      t.timestamps
      t.datetime :date
      t.text :text
      t.decimal :longitude, precision: 12, scale: 9
      t.decimal :latitude, precision: 12, scale: 9
      t.references :session
    end
  end
end
