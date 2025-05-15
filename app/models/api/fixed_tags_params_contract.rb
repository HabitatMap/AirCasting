module Api
  class FixedTagsParamsContract < Dry::Validation::Contract
    params do
      required(:input).value(:string)
      required(:time_from).filled(:time)
      required(:time_to).filled(:time)
      required(:sensor_name).filled(:string)
      required(:unit_symbol).filled(:string)
      required(:usernames).value(:string)
      required(:west).filled(:float)
      required(:east).filled(:float)
      required(:south).filled(:float)
      required(:north).filled(:float)
      required(:is_indoor).filled(:bool)
      required(:is_active).filled(:bool)
    end
  end
end
