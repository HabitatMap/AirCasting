class AddLastHourlyAverageToStreams < ActiveRecord::Migration[6.1]
  def change
    add_reference :streams,
                  :last_hourly_average,
                  foreign_key: {
                    to_table: :stream_hourly_averages,
                  }
  end
end
