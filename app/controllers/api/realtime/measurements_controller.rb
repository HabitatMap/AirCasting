module Api
  module Realtime
    class MeasurementsController < BaseController
      # TokenAuthenticatable was removed from Devise in 3.1
      # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
      before_action :authenticate_user_from_token!, only: :create
      before_action :authenticate_user!, only: :create

      respond_to :json

      def create
        if params[:compression]
          decoded = Base64.decode64(params[:data])
          unzipped = AirCasting::GZip.inflate(decoded)
        else
          unzipped = params[:data]
        end
        data = deep_symbolize ActiveSupport::JSON.decode(unzipped)

        # hot fix for AirBeam sending `time` with seconds out of range (e.g. \"time\":\"2024-09-26T12:25:87\")

        measurement_time = data[:measurements].first[:time]
        begin
          measurement_time.to_datetime
        rescue Date::Error
          data[:measurements].first[:time] =
            measurement_time.sub(/T(\d{2}):(\d{2}):(\d{2,})/) do |match|
              hour = $1
              minute = $2
              # Set the seconds to 00 regardless of value
              "T#{hour}:#{minute}:00"
            end
        end

        # end of hot fix

        session_uuid = data.delete(:session_uuid)
        stream_data = { data[:stream_name] => data }
        result =
          RealtimeMeasurementBuilder.new(
            session_uuid,
            stream_data,
            current_user,
          ).build!

        if result
          head :ok
        else
          head :bad_request
        end
      end
    end
  end
end
