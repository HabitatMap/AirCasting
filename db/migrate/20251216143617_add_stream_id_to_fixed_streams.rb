class AddStreamIdToFixedStreams < ActiveRecord::Migration[7.0]
  def change
    add_column :fixed_streams, :stream_id, :bigint
  end
end
