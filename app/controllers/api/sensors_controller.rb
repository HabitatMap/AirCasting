module Api
  class SensorsController < BaseController
    def index
      contract = Api::SensorsContract.new.call(params.to_unsafe_hash)
      result = Api::ToSensorsArray.new(contract: contract).call

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
