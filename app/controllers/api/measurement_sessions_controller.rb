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
    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_action :authenticate_user_from_token!, :only => :create
    before_action :authenticate_user!, :only => :create

    respond_to :json

    def create
      if ActiveModel::Type::Boolean.new.cast(params[:compression])
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
        head :bad_request
      end
    end

    def export
      service = Csv::ExportSessionsToCsv.new

      begin
        zip_path = service.call(params[:session_ids])
        zip_file = File.read(zip_path)
        zip_filename = File.basename(zip_path)
        send_data zip_file, type: Mime::ZIP, filename: zip_filename,  disposition: "attachment"
      ensure
        service.clean
      end
    end

    private

    def decoded_query_data(query)
      if query.is_a?(String)
        ActiveSupport::JSON.decode(query).symbolize_keys
      elsif query
        query.symbolize_keys
      else
        {}
      end
    end

    def session_json(session)
      {
        :location => short_session_url(session, :host => A9n.host_),
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
