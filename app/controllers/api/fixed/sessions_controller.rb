module Api
  class Fixed::SessionsController < BaseController
    respond_to :json

    def show
      GoogleAnalytics.new.register_event('Fixed Sessions#show')

      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::Session::Schema,
          struct: Api::Session::Struct
        )
      result = Api::ToSessionHash.new(model: FixedSession).call(form: form)

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def show2
      GoogleAnalytics.new.register_event('Fixed Sessions#show2')
      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::Session::Schema,
          struct: Api::Session::Struct
        )
      result = Api::ToFixedSessionHash.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
