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
  class MeasurementSessionsController < BaseController
    INT_Q_ATTRS = [:time_from, :time_to, :day_from, :day_to]

    before_filter :authenticate_user!, :only => :create

    respond_to :json

    def index
      data = params[:q].symbolize_keys
      INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

      respond_with Session.filtered_json(data)
    end

    def create
      if params[:compression]
        decoded = Base64.decode64(params[:session])
        unzipped = AirCasting::GZip.inflate(decoded)
      else
        unzipped = params[:session]
      end
      photos = params[:photos] || []

      session = Session.create_from_json(unzipped, photos, current_user)

      if session
        render :json => session_json(session), :status => :ok
      else
        render :nothing => true, :status => :bad_request
      end
    end

    def show
      session = Session.find(params[:id])

      respond_with session, :methods => [:measurements, :notes]
    end

    private

    def session_json(session)
      {
        :location => short_session_url(session),
        :notes => session.notes.map do |note|
          {
            :number => note.number,
            :photo_location => photo_location(note)
          }
        end
      }
    end
  end
end
