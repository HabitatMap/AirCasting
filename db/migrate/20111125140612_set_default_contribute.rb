class SetDefaultContribute < ActiveRecord::Migration[4.2]
  def up
    Session.update_all(contribute: true)
  end

  def down; end
end
