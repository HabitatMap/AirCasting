module Api
  class SessionContract < Dry::Validation::Contract
    params do
      required(:id).filled(:integer)
      optional(:measurements_limit).filled(:integer)
    end
  end
end
