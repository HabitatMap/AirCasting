module Api
  class ThresholdAlertsContract < Dry::Validation::Contract
    params do
      required(:sensor_name).filled(:string)
      required(:session_uuid).filled(:string)
      required(:threshold_value).filled(:float)
      required(:frequency).filled(:integer)
      required(:timezone_offset).filled(:integer)
    end
  end
end
