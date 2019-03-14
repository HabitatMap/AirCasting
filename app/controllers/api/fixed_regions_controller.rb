require 'dry-validation'

module Api
  class FixedRegionsController < BaseController
    def show
      data = ActiveSupport::JSON.decode(params[:q]).symbolize_keys

      if validate(data).success?
        respond_with FixedRegionInfo.new.call(data)
      end
    end

    private

    def validate(data)
      schema = Dry::Validation.Schema do
        required(:sensor_name).filled(:str?)
        required(:session_ids).each(:int?)
      end

      schema.call(data)
    end
  end
end
