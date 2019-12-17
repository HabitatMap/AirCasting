class CreateSessions < ActiveRecord::Migration[4.2]
  def change
    create_table :sessions, &:timestamps
  end
end
