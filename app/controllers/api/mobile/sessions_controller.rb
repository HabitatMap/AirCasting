module Api
  class Mobile::SessionsController < BaseController
    respond_to :json

    def show
      form = Api::ParamsForm.new(params: params, schema: Api::Session::Schema, struct: Api::Session::Struct)
      result = Api::ToSessionHash.new(model: MobileSession).call(form: form)

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
