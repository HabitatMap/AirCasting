module Api
  module V3
    class SessionsController < BaseController
      def index
        result =
          ::Sessions::IndexInteractor.new.call(
            sensor_package_name: params[:sensor_package_name],
            start_datetime: params[:start_datetime],
            end_datetime: params[:end_datetime],
          )

        if result.success?
          render json: result.value, status: :ok
        else
          render json: result.errors, status: :bad_request
        end
      end
    end
  end
end
