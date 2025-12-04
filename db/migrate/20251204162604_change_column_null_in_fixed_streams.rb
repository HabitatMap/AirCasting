class ChangeColumnNullInFixedStreams < ActiveRecord::Migration[7.0]
  def up
    change_column_null :fixed_streams, :first_measured_at, true
    change_column_null :fixed_streams, :last_measured_at, true
  end

  def down
    change_column_null :fixed_streams, :first_measured_at, false
    change_column_null :fixed_streams, :last_measured_at, false
  end
end
