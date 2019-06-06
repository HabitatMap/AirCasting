module Api
  class Mobile::SessionsController < BaseController
    respond_to :json

    def index
      q = ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
      q[:time_from] = Time.strptime(q[:time_from].to_s, "%s")
      q[:time_to] = Time.strptime(q[:time_to].to_s, "%s")

      form = Api::ParamsForm.new(params: q, schema: Api::MobileSessions::Schema, struct: Api::MobileSessions::Struct)
      result = Api::ToMobileSessionsArray.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def show
      form = Api::ParamsForm.new(params: params.to_unsafe_hash, schema: Api::Session::Schema, struct: Api::Session::Struct)
      result = Api::ToSessionHash.new(model: MobileSession).call(form: form)

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def show2
      form = Api::ParamsForm.new(params: params.to_unsafe_hash, schema: Api::Session::Schema, struct: Api::Session::Struct)
      result = Api::ToSessionHash2.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
