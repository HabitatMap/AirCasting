module Api
  class MeasurementsController < BaseController
    respond_to :json

    def index
      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::Measurements::Schema,
          struct: Api::Measurements::Struct,
        )
      result = Api::ToMeasurementsArray.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
