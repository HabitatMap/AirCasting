module Api
  module Realtime
    class MeasurementsController < BaseController
      # TokenAuthenticatable was removed from Devise in 3.1
      # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
      before_action :authenticate_user_from_token!, only: :create
      before_action :authenticate_user!, only: :create

      respond_to :json

      def create
        GoogleAnalytics.new.register_event('Realtime measurements#create')
        if params[:compression]
          decoded = Base64.decode64(params[:data])
          unzipped = AirCasting::GZip.inflate(decoded)
        else
          unzipped = params[:data]
        end
        data = deep_symbolize ActiveSupport::JSON.decode(unzipped)

        session_uuid = data.delete(:session_uuid)
        stream_data = { data[:stream_name] => data }
        result =
          RealtimeMeasurementBuilder.new(
            session_uuid,
            stream_data,
            current_user
          )
            .build!

        if result
          head :ok
        else
          head :bad_request
        end
      end
    end
  end
end
