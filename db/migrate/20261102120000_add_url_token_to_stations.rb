# The short share token behind `/g/:url_token`, the government counterpart of
# `/s/:url_token` for a session. `stations.uuid` already addresses a station
# uniquely, but a 36-character uuid is not something anyone pastes into a
# message — hence a second, short, opaque identifier rather than reusing it.
#
# Nullable on purpose. A unique index permits many NULLs, so rows written
# before the backfill stay legal, and `StationsUpserter` fills new ones as it
# sees them. The NOT NULL, if it is ever wanted, is a separate three-step
# migration once the backfill has drained.
class AddUrlTokenToStations < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  LOCK_TIMEOUT = '3s'.freeze
  ATTEMPTS = 5
  BACKOFF = 5
  INDEX_NAME = 'index_stations_on_url_token'.freeze

  def up
    # No default and nullable: metadata-only, no table rewrite.
    with_bounded_lock do
      add_column :stations, :url_token, :string, if_not_exists: true
    end

    drop_invalid_index
    add_index :stations,
              :url_token,
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
    with_bounded_lock { remove_column :stations, :url_token, if_exists: true }
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
