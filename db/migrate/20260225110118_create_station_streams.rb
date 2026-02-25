class CreateStationStreams < ActiveRecord::Migration[7.0]
  def change
    create_table :station_streams do |t|
      t.references :source, null: false, foreign_key: true
      t.references :stream_configuration, null: false, foreign_key: true
      t.string :external_ref, null: false
      t.geometry :location, limit: { srid: 4326, type: 'geometry' }
      t.string :time_zone, null: false
      t.timestamptz :first_measured_at
      t.timestamptz :last_measured_at
      t.string :title, null: false
      t.string :url_token, null: false
      t.uuid :uuid, default: 'gen_random_uuid()', null: false

      t.timestamps
    end

    add_index :station_streams, :location, using: :gist
    add_index :station_streams, %i[source_id stream_configuration_id external_ref],
              unique: true, name: 'idx_station_streams_src_cfg_ref_uniq'
    add_index :station_streams, :external_ref
    add_index :station_streams, :uuid, unique: true
    add_index :station_streams, :url_token, unique: true

    add_check_constraint :station_streams,
                         'first_measured_at <= last_measured_at',
                         name: 'chk_station_stream_measured_bounds'
  end
end
