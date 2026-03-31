module Api
  module V3
    module FixedSessions
      class MeasurementsController < BaseController
        before_action :authenticate_user_from_token!
        before_action :authenticate_user!

        def create
          binary = request.body.read
          result =
            ::FixedSessions::AirBeamMini2::Ingester.new.call(
              uuid: params[:fixed_session_uuid],
              binary: binary,
              user_id: current_user.id,
              sync: params[:sync].present?,
            )

          if result.success?
            head :ok
          else
            render json: result.errors, status: :bad_request
          end
        end
      end
    end
  end
end
