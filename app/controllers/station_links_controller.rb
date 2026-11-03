# `/g/:url_token` -- the government counterpart of `/s/:url_token`
# (MeasurementSessionsController). Same contract, same failure shape.
class StationLinksController < ApplicationController
  def show
    contract = Api::LinksContract.new.call(params.to_unsafe_hash)
    result = Api::ToStationLink.new(contract: contract).call

    if result.success?
      redirect_to result.value
    else
      render json: result.errors, status: :bad_request
    end
  end
end
