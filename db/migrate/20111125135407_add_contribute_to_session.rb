class AddContributeToSession < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :contribute, :boolean
  end
end
