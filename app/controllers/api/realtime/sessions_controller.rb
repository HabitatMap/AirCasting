module Api
  module Realtime
    class SessionsController < BaseController
      require 'uri'

      # TokenAuthenticatable was removed from Devise in 3.1
      # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
      before_action :authenticate_user_from_token!, only: :create
      before_action :authenticate_user!, only: :create

      respond_to :json

      def show
        GoogleAnalyticsWorker::RegisterEvent.async_call(
          'Realtime sessions#show'
        )
        session = FixedSession.find(params[:id])

        respond_with session, sensor_id: params[:sensor_id], methods: %i[notes]
      end

      def sync_measurements
        GoogleAnalyticsWorker::RegisterEvent.async_call(
          'Realtime sessions#sync_measurements'
        )
        result = Sessions::SyncMeasurementsInteractor.new.call(
          uuid: params[:uuid],
          last_measurement_sync: params[:last_measurement_sync]
        )

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end

      def create
        GoogleAnalyticsWorker::RegisterEvent.async_call(
          'Realtime sessions#create'
        )
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
          head :bad_request
        end
      end

      private

      def session_json(session)
        {
          location: short_session_url(session, host: A9n.host_),
          notes:
            session.notes.map do |note|
              { number: note.number, photo_location: photo_location(note) }
            end
        }
      end
    end
  end
end
