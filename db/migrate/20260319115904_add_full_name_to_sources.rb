class AddFullNameToSources < ActiveRecord::Migration[7.0]
  def up
    add_column :sources, :full_name, :string

    Source.find_by(name: 'EPA')&.update_columns(full_name: 'US EPA AirNow')
    Source.find_by(name: 'EEA')&.update_columns(full_name: 'EEA')
  end

  def down
    remove_column :sources, :full_name
  end
end
