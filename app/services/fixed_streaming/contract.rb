module FixedStreaming
  class Contract < Dry::Validation::Contract
    params do
      required(:measurement_type).filled(:string)
      required(:sensor_package_name).filled(:string)
      required(:sensor_name).filled(:string)
      required(:session_uuid).filled(:string)
      required(:measurement_short_type).filled(:string)
      required(:unit_symbol).filled(:string)
      required(:threshold_high).filled(:integer)
      required(:threshold_low).filled(:integer)
      required(:threshold_medium).filled(:integer)
      required(:threshold_very_high).filled(:integer)
      required(:threshold_very_low).filled(:integer)
      required(:unit_name).filled(:string)

      required(:measurements)
        .array(:hash) do
          required(:longitude).filled(:float)
          required(:latitude).filled(:float)
          required(:time).filled(:string)
          required(:value).filled(:integer)
        end
    end
  end
end
