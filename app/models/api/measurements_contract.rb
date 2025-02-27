module Api
  class MeasurementsContract < Dry::Validation::Contract
    params do
      required(:stream_ids).filled(:string)
      optional(:start_time).filled(:float)
      optional(:end_time).filled(:float)
    end
  end
end
