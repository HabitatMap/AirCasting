class CreateSourceStreamConfigurations < ActiveRecord::Migration[7.0]
  def change
    create_table :source_stream_configurations do |t|
      t.references :source, null: false, foreign_key: true
      t.references :stream_configuration, null: false, foreign_key: true

      t.timestamps
    end

    add_index :source_stream_configurations,
              %i[source_id stream_configuration_id],
              unique: true,
              name: 'idx_source_stream_cfg_uniq'
  end
end
