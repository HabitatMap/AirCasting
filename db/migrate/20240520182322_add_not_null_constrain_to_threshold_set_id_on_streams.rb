class AddNotNullConstrainToThresholdSetIdOnStreams < ActiveRecord::Migration[6.1]
  def change
    change_column_null :streams, :threshold_set_id, false
  end
end
