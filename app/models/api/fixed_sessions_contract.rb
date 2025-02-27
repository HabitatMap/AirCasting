module Api
  class FixedSessionsContract < Dry::Validation::Contract
    params do
      required(:time_from).filled(:time)
      required(:time_to).filled(:time)
      required(:sensor_name).filled(:string)
      required(:measurement_type).filled(:string)
      required(:unit_symbol).filled(:string)
      required(:tags).value(:string)
      required(:usernames).value(:string)
      optional(:is_indoor).filled(:bool)
      optional(:west).filled(:float)
      optional(:east).filled(:float)
      optional(:south).filled(:float)
      optional(:north).filled(:float)
      optional(:limit).filled(:integer)
      optional(:offset).filled(:integer)
      optional(:zoom_level).filled(:integer)
    end
  end
end
