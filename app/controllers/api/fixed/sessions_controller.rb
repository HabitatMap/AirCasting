module Api
  class Fixed::SessionsController < BaseController
    respond_to :json

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed Sessions#show')

      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::Session::Schema,
          struct: Api::Session::Struct
        )
      result = Api::ToFixedSessionHash.new(model: FixedSession, form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def show2
      GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed Sessions#show2')
      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::Session::Schema,
          struct: Api::Session::Struct
        )
      result = Api::ToFixedSessionHash2.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
