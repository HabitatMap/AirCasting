module Api
  class MobileSessionsContract < Dry::Validation::Contract
    params do
      required(:time_from).filled(:time)
      required(:time_to).filled(:time)
      required(:sensor_name).filled(:string)
      required(:measurement_type).filled(:string)
      required(:unit_symbol).filled(:string)
      required(:tags).value(:string)
      required(:usernames).value(:string)
      required(:west).filled(:float)
      required(:east).filled(:float)
      required(:south).filled(:float)
      required(:north).filled(:float)
      required(:limit).filled(:integer)
      required(:offset).filled(:integer)
    end
  end
end
