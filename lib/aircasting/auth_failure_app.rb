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

class AuthFailureApp < ActionController::Base
  def show
    respond_to do |format|
      format.json { render :nothing => true, :status => :unauthorized }
      format.html { redirect_to Rails.application.routes.url_helpers.new_user_session_path }
    end
  end

  def sync
    respond_to do |format|
      format.json { render :nothing => true, :status => :unauthorized }
    end
  end

  def create
    show
  end
end
