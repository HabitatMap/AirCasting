class AddDeletionConfirmationToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :deletion_confirm_code, :string
    add_column :users, :deletion_code_valid_until, :datetime
  end
end
