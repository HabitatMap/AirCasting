class CreateStations < ActiveRecord::Migration[7.0]
  def change
    create_table :stations do |t|
      t.bigint :source_id, null: false
      t.string :external_ref, null: false
      t.string :title, null: false
      t.geometry :location, limit: { srid: 4326, type: 'geometry' }
      t.string :time_zone, null: false
      t.string :excluded_reason

      t.timestamps
    end

    add_index :stations, %i[source_id external_ref],
              unique: true,
              name: 'idx_stations_src_ref_uniq'
    add_index :stations, :location, using: :gist
    add_foreign_key :stations, :sources
  end
end
