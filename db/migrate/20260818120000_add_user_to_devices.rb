# Phase 1 of 3 (deploy 1, migrations only — no application change).
#
# Purely additive: the column is nullable, so the currently deployed code, which
# writes devices without a `user_id`, keeps working untouched.
#
# The foreign key is added unvalidated and validated in a second step: adding it
# in one go takes a lock on `users` (~19k rows) for the length of the scan, while
# `VALIDATE CONSTRAINT` only needs a SHARE UPDATE EXCLUSIVE lock.
class AddUserToDevices < ActiveRecord::Migration[7.0]
  def up
    add_column :devices, :user_id, :bigint, null: true
    add_index :devices, :user_id

    add_foreign_key :devices, :users, validate: false
    validate_foreign_key :devices, :users
  end

  def down
    remove_foreign_key :devices, :users
    remove_index :devices, :user_id
    remove_column :devices, :user_id
  end
end
