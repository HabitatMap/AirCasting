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

class Api::UserSessionsController < Api::BaseController

  before_filter :authenticate_user!

  respond_to :json

  def sync
    data = JSON.parse(params[:data])
    data = deep_symbolize(data)

    response = current_user.sync(data)
    respond_with(response, :location => nil)
  end

  def show
    session = current_user.sessions.find_by_id(params[:id]) or raise NotFound

    response = session.as_synchronizable.
      merge(:location => short_session_url(session, :host => AppConfig.host)).
      merge(:tag_list => session.tag_list.join(" ")).
      merge(:notes => prepare_notes(session.notes))

    respond_with response
  end

  def delete_session
    data = decode_and_deep_symbolize(params)

    a_session = current_user.sessions.find_by_uuid(data[:uuid])
    if a_session
      a_session.destroy
      render :json => {:success => true}
    else
      render :json => {:success => false, :no_such_session => true }
    end
  end

  def delete_session_streams
    session_data = decode_and_deep_symbolize(params)

    a_session = current_user.mobile_sessions.find_by_uuid(session_data[:uuid])
    if a_session
      (session_data[:streams] || []).each do |key, stream_data|
        if stream_data[:deleted]
          a_session.streams.where(
              :sensor_package_name => stream_data[:sensor_package_name],
              :sensor_name => stream_data[:sensor_name]
          ).each(&:destroy)
        end
      end
      render :json => {:success => true}
    else
      render :json => {:success => false, :no_such_session => true }
    end
  end

  private

  def decode_and_deep_symbolize(params)
    if params[:compression]
      decoded = Base64.decode64(params[:session])
      session_json = AirCasting::GZip.inflate(decoded)
    else
      session_json = params[:session]
    end

    data = JSON.parse(session_json)
    data = deep_symbolize(data)
  end

  def prepare_notes(notes)
    notes.map do |note|
      note.as_json.merge(:photo_location => photo_location(note))
    end
  end

end
