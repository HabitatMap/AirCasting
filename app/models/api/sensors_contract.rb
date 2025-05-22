module Api
  class SensorsContract < Dry::Validation::Contract
    params { required(:session_type).filled(:string) }
  end
end
