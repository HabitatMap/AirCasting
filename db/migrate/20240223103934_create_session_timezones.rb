class CreateSessionTimezones < ActiveRecord::Migration[6.1]
  def change
    create_table :session_timezones do |t|
      t.integer :session_id
      t.string :timezone_name
    end
  end
end
