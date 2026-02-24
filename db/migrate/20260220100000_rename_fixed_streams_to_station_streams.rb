class RenameFixedStreamsToStationStreams < ActiveRecord::Migration[7.0]
  def change
    rename_table :fixed_streams, :station_streams

    rename_column :fixed_measurements, :fixed_stream_id, :station_stream_id
    rename_column :hourly_averages, :fixed_stream_id, :station_stream_id
  end
end
