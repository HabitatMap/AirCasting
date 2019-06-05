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

class MeasurementSessionsController < ApplicationController
  layout 'map'

  def show
    session = Session.find_by_url_token(params[:url_token]) or raise NotFound

    selected_session_ids = [session.id]
    data = { sensorId: "Temperature-airbeam2-f (F)" }

    anchor = "?selectedSessionIds=#{selected_session_ids.to_json}&data=#{data.to_json}"

    if (session.type == "FixedSession")
      redirect_to fixed_map_path(:anchor => anchor)
    else
      redirect_to map_path(:anchor => anchor)
    end
  end
end
