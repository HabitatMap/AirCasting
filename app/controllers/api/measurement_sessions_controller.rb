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
      if params[:q].is_a?(String)
        data = ActiveSupport::JSON.decode(params[:q]).symbolize_keys
      elsif params[:q]
        data = params[:q].symbolize_keys
      else
        data = {}
      end
      INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

      page = params[:page] || 0
      page_size = params[:page_size] || 50

      begin
        respond_with MobileSession.filtered_json(data, page, page_size)
      rescue WrongCoordinatesError => e
        error = { :error => "Invalid Location" }
        respond_with error, :status => :not_found
      end
    end

    def create
      if params[:compression]
        decoded = Base64.decode64(params[:session])
        unzipped = AirCasting::GZip.inflate(decoded)
      else
        unzipped = params[:session]
      end
      photos = params[:photos] || []

      data = deep_symbolize ActiveSupport::JSON.decode(unzipped)
      data[:type] = 'MobileSession' # backward compatibility

      session = SessionBuilder.new(data, photos, current_user).build!

      if session
        render :json => session_json(session), :status => :ok
      else
        render :nothing => true, :status => :bad_request
      end
    end

    def show
      session = MobileSession.find(params[:id])

      respond_with session, :sensor_id => params[:sensor_id], :methods => [:measurements, :notes]
    end

    def export
      sessions = Session.includes(streams: :measurements).find(params[:session_ids])
      begin
        exporter = SessionsExporter.new(sessions)
        data = exporter.export
        send_data data, type: exporter.mime_type, filename: exporter.filename,  disposition: 'attachment'
      ensure
        exporter.clean
      end
    end

    private

    def session_json(session)
      {
        :location => short_session_url(session, :host => AppConfig.host),
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
