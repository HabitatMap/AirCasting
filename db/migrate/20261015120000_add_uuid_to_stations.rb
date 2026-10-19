class AddUuidToStations < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  LOCK_TIMEOUT = '3s'.freeze
  ATTEMPTS = 5
  BACKOFF = 5
  INDEX_NAME = 'index_stations_on_uuid'.freeze

  def up
    with_bounded_lock do
      add_column :stations,
                 :uuid,
                 :uuid,
                 default: -> { 'gen_random_uuid()' },
                 null: false,
                 if_not_exists: true
    end

    drop_invalid_index
    add_index :stations,
              :uuid,
              unique: true,
              name: INDEX_NAME,
              algorithm: :concurrently,
              if_not_exists: true
  end

  def down
    remove_index :stations,
                 name: INDEX_NAME,
                 algorithm: :concurrently,
                 if_exists: true
    with_bounded_lock { remove_column :stations, :uuid, if_exists: true }
  end

  private

  # A CONCURRENTLY build that fails leaves its index in place, marked INVALID.
  def drop_invalid_index
    invalid = select_value(<<~SQL)
      SELECT NOT indisvalid FROM pg_index
      WHERE indexrelid = to_regclass('#{INDEX_NAME}')
    SQL
    return unless invalid

    say "dropping invalid #{INDEX_NAME} left by an interrupted build"
    remove_index :stations, name: INDEX_NAME, algorithm: :concurrently
  end

  # ActiveRecord::LockWaitTimeout is the mapping for SQLSTATE 55P03, which is
  # what lock_timeout raises.
  def with_bounded_lock
    execute "SET lock_timeout = '#{LOCK_TIMEOUT}'"

    attempt = 0
    begin
      yield
    rescue ActiveRecord::LockWaitTimeout
      attempt += 1
      raise if attempt >= ATTEMPTS

      say "lock on stations not available after #{LOCK_TIMEOUT}, retry #{attempt}/#{ATTEMPTS - 1}"
      sleep BACKOFF
      retry
    ensure
      execute 'SET lock_timeout = DEFAULT'
    end
  end
end
