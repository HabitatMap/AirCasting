module Api
  module V3
    class StreamsController < BaseController
      def index
        result =
          ::Streams::IndexInteractor.new.call(
            sensor_package_name: params[:sensor_package_name],
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
