class AddDefaultToStreamsMeasurementsCount < ActiveRecord::Migration[4.2]
  def change
    change_column :streams,
                  :measurements_count,
                  :integer,
                  null: false,
                  default: 0
  end
end
