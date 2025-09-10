module Api
  class FixedMeasurementsContract < Dry::Validation::Contract
    params do
      required(:stream_id).filled(:string)
      required(:start_time).filled(:float)
      required(:end_time).filled(:float)
    end

    rule(:end_time, :start_time) do
      if values[:end_time] <= values[:start_time]
        key(:end_time).failure('must be greater than start_time')
      end
    end
  end
end
