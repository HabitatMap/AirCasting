# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
# You can contact the authors by email at <info@habitatmap.org>

class ChangeCoordinatesToDecimal < ActiveRecord::Migration
  def up
    change_table :measurements do |t|
      t.change :latitude, :decimal, :precision => 12, :scale => 9
      t.change :longitude, :decimal, :precision => 12, :scale => 9
    end

    change_table :regions do |t|
      t.change :north, :decimal, :precision => 12, :scale => 9
      t.change :south, :decimal, :precision => 12, :scale => 9
      t.change :east, :decimal, :precision => 12, :scale => 9
      t.change :west, :decimal, :precision => 12, :scale => 9
    end
  end

  def down
    change_table :measurements do |t|
      t.change :latitude, :float
      t.change :longitude, :float
    end

    change_table :regions do |t|
      t.change :north, :float
      t.change :south, :float
      t.change :east, :float
      t.change :west, :float      
    end
  end
end
