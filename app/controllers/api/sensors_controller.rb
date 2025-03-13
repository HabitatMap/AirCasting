module Api
  class SensorsController < BaseController
    def index
      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::Sensors::Schema,
          struct: Api::Sensors::Struct,
        )
      result = Api::ToSensorsArray.new(form: form).call

      if result.success?
        cache_control =
          ["max-age=#{8.hours}", 'public', 'must_revalidate'].join(', ')
        response.headers['Cache-Control'] = cache_control

        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
