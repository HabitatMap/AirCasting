module Api
  module V3
    class FixedMeasurementsController < BaseController
      def index
        result =
          ::FixedMeasurements::IndexInteractor.new.call(
            params: params.to_unsafe_hash,
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
