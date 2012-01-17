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

class AddAttachmentPhotoToNote < ActiveRecord::Migration
  def self.up
    add_column :notes, :photo_file_name, :string
    add_column :notes, :photo_content_type, :string
    add_column :notes, :photo_file_size, :integer
    add_column :notes, :photo_updated_at, :datetime
  end

  def self.down
    remove_column :notes, :photo_file_name
    remove_column :notes, :photo_content_type
    remove_column :notes, :photo_file_size
    remove_column :notes, :photo_updated_at
  end
end
