module Api
  class SessionBySensorNameContract < Dry::Validation::Contract
    params do
      required(:id).filled(:integer)
      required(:sensor_name).filled(:string)
      optional(:measurements_limit).filled(:integer)
    end
  end
end
