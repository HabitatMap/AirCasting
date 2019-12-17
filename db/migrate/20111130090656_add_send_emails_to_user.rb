class AddSendEmailsToUser < ActiveRecord::Migration[4.2]
  def change
    add_column :users, :send_emails, :boolean
  end
end
