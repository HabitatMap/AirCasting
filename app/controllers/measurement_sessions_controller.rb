class MeasurementSessionsController < ApplicationController
  def show
    contract = Api::LinksContract.new.call(params.to_unsafe_hash)
    result = Api::ToLink.new(contract: contract).call

    if result.success?
      redirect_to result.value
    else
      render json: result.errors, status: :bad_request
    end
  end
end
