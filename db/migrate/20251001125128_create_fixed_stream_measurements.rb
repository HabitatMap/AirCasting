class CreateFixedStreamMeasurements < ActiveRecord::Migration[7.0]
  def change
    create_table :fixed_stream_measurements do |t|
      t.references :fixed_stream,
                   null: false,
                   foreign_key: {
                     on_delete: :cascade,
                   }
      t.timestamptz :measured_at, null: false, precision: 6
      t.float :value, null: false

      t.timestamps
    end

    add_index :fixed_stream_measurements,
              %i[fixed_stream_id measured_at],
              unique: true,
              name: 'idx_fixed_measurements_stream_measured_at_uniq'
  end
end
