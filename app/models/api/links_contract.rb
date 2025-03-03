module Api
  class LinksContract < Dry::Validation::Contract
    params do
      required(:url_token).filled(:string)
      required(:sensor_name).filled(:string)
    end
  end
end
