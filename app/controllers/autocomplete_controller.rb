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

class AutocompleteController < ApplicationController
  FINDER_SQL = "SELECT name FROM tags WHERE name LIKE ? LIMIT ?"

  def tags
    q = params[:q]

    if q.present?
      sql_query = ActiveRecord::Base.send(:sanitize_sql_array, [FINDER_SQL, "#{q}%", params[:limit].to_i])
      tag_names = ActiveRecord::Base.connection.execute(sql_query).to_a.flatten

      render :text => tag_names.join("\n")
    else
      render :text => ""
    end
  end

  def usernames
    q = params[:q]

    if q.present?
      names = User.select("username").where("username LIKE ?", "#{q}%").order(:username).map(&:username)
      render :text => names.join("\n")
    else
      render :text => ""
    end
  end
end
