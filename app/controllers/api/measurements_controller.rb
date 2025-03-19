module Api
  class MeasurementsController < BaseController
    respond_to :json

    def index
      contract = Api::MeasurementsContract.new.call(params.to_unsafe_hash)
      result = Api::ToMeasurementsArray.new(contract: contract).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
