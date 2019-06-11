class RemoveGcmTokenFromUsers < ActiveRecord::Migration[5.2]
  def change
    if column_exists?(:users, :gcm_token)
      remove_column :users, :gcm_token
    end
  end
end
