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

module Api
  module Realtime
    class MeasurementsController < BaseController
      before_filter :authenticate_user!

      respond_to :json

      def create
        if params[:compression]
          decoded = Base64.decode64(params[:data])
          unzipped = AirCasting::GZip.inflate(decoded)
        else
          unzipped = params[:data]
        end
        data = deep_symbolize ActiveSupport::JSON.decode(unzipped)

        session_uuid = data.delete(:session_uuid)
        stream_data = { data[:stream_name] => data }
        result = RealtimeMeasurementBuilder.new(session_uuid, stream_data, current_user).build!

        if result
          render :nothing => true, :status => :ok
        else
          render :nothing => true, :status => :bad_request
        end
      end
    end
  end
end
