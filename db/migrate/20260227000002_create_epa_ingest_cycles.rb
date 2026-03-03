class CreateEpaIngestCycles < ActiveRecord::Migration[7.0]
  def change
    create_table :epa_ingest_cycles do |t|
      t.timestamptz :window_starts_at, null: false
      t.timestamptz :window_ends_at, null: false
      t.string :status, null: false, default: 'staging'

      t.timestamps
    end

    add_check_constraint :epa_ingest_cycles,
                         'window_starts_at < window_ends_at',
                         name: 'chk_epa_ingest_cycles_window_bounds'
  end
end
