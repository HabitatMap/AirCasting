class AddNumberToNotes < ActiveRecord::Migration[4.2]
  def change
    add_column :notes, :number, :integer
  end
end
