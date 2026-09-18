module Api
  module V3
    module FixedStreaming
      class MeasurementsController < BaseController
        before_action :authenticate_user_from_token!, only: :create
        before_action :authenticate_user!, only: :create

        def create
          result =
            ::FixedStreaming::Interactor.new.call(
              data: params[:data],
              compression: params[:compression],
              user_id: current_user.id,
            )

          if result.success?
            head :ok
          else
            # LEGACY: AirBeams post here over WiFi. Left exactly as it was —
            # unifying the body is not worth changing a live device contract.
            render json: result.errors, status: :bad_request
          end
        end
      end
    end
  end
end
