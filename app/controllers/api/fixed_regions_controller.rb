module Api
  class FixedRegionsController < BaseController
    rescue_from Errors::Api::CouldNotParseJsonParams do |exception|
      render json: 'could not parse request', status: :bad_request
    end

    def show
      form =
        Api::JsonForm.new(
          json: params.to_unsafe_hash[:q],
          schema: Api::FixedRegion::Schema,
          struct: Api::FixedRegion::Struct
        )
      result = Api::CalculateFixedRegionInfo.new.call(form)

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
