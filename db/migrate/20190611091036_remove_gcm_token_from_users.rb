class RemoveGcmTokenFromUsers < ActiveRecord::Migration[5.2]
  def change
    remove_column :users, :gcm_token if column_exists?(:users, :gcm_token)
  end
end
