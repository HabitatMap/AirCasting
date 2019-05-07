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
    class SessionsController < BaseController
      require 'uri'

      INT_Q_ATTRS = [:time_from, :time_to, :day_from, :day_to, :limit, :offset]

      # TokenAuthenticatable was removed from Devise in 3.1
      # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
      before_filter :authenticate_user_from_token!, only: :create
      before_filter :authenticate_user!, only: :create

      respond_to :json

      def index_streaming
        data = decoded_query_data(params[:q])
        INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

        data[:time_from] = Time.strptime(data[:time_from].to_s, '%s')
        data[:time_to] = Time.strptime(data[:time_to].to_s, '%s')
        sessions = FixedSession.filtered_streaming_json(data)

        respond_with sessions: sessions,
                     fetchableSessionsCount: sessions.count
      end

      def show
        session = FixedSession.find(params[:id])

        respond_with session, sensor_id: params[:sensor_id], methods: [:notes]
      end

      def sync_measurements
        session = FixedSession.find_by_uuid(params[:uuid]) or raise NotFound
        last_measurement_sync = URI.decode(params[:last_measurement_sync]).to_datetime
        stream_measurements = true

        response = session.as_synchronizable(stream_measurements, last_measurement_sync)

        respond_with response
      end

      def show_multiple
        data = decoded_query_data(params[:q])

        respond_with sessions: FixedSession.selected_sessions_json(data)
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
        session = SessionBuilder.new(data, photos, current_user).build!

        if session
          render json: session_json(session), status: :ok
        else
          render nothing: true, status: :bad_request
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
          location: short_session_url(session, host: A9n.host_),
          notes: session.notes.map do |note|
            {
              number: note.number,
              photo_location: photo_location(note)
            }
          end
        }
      end
    end
  end
end
