module Api
  class Fixed::SessionsController < BaseController
    respond_to :json

    def show_all_streams
      contract = Api::SessionContract.new.call(params.to_unsafe_hash)
      result = Api::ToFixedSessionWithStreamsHash.new(contract: contract).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
