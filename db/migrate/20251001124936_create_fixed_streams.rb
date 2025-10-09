class CreateFixedStreams < ActiveRecord::Migration[7.0]
  def change
    create_table :fixed_streams do |t|
      t.references :source, null: false, foreign_key: true
      t.references :stream_configuration,
                   null: false,
                   foreign_key: true,
                   index: true
      t.string :external_ref, null: false
      t.geometry :location, limit: { srid: 4326, type: 'geometry' }, null: true
      t.string :time_zone, null: false
      t.timestamptz :first_measured_at, precision: 6, null: false
      t.timestamptz :last_measured_at, precision: 6, null: false

      t.timestamps
    end

    add_index :fixed_streams,
              %i[source_id stream_configuration_id external_ref],
              unique: true,
              name: 'idx_fixed_streams_src_ref_cfg_uniq'

    add_index :fixed_streams, :location, using: :gist

    add_check_constraint :fixed_streams,
                         'first_measured_at <= last_measured_at',
                         name: 'chk_stream_measured_bounds'
  end
end
