class AddUniqueIndexOnSessionsLowerUuid < ActiveRecord::Migration[7.0]
  # LOWER(uuid), not uuid: uniqueness is enforced case-insensitively by the model
  # validation, both API contracts and Session.with_uuid_lock, so an index on the
  # raw column would let the database accept a pair the application rejects.
  #
  # index_sessions_on_uuid stays — a functional index cannot serve find_by_uuid.
  disable_ddl_transaction!

  def change
    add_index :sessions,
              'LOWER(uuid)',
              unique: true,
              algorithm: :concurrently,
              name: 'index_sessions_on_lower_uuid'
  end
end
