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
    @session = MobileSession.find_by_url_token(params[:url_token]) or raise NotFound
    lat = @session.streams.first.min_latitude.to_f
    lng = @session.streams.first.min_longitude.to_f
    stream = @session.streams.first

    map = { zoom:16,lat:lat,lng:lng,mapType:"hybrid" }
    sessionsIds = [@session.id]
    tmp = { tmpSensorId: stream.sensor_full_name }
    data = {
      heat: { highest: stream.threshold_very_high,
              high: stream.threshold_high,
              mid: stream.threshold_medium,
              low: stream.threshold_low,
              lowest: stream.threshold_very_low },
      usernames: @session.user.username
    }

    redirect_to map_path(
      :anchor => "/map_sessions?map=#{map.to_json}&sessionsIds=#{sessionsIds.to_json}&tmp=#{tmp.to_json}&data=#{data.to_json}"
    )
  end
end
