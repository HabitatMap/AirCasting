module Sessions
  class Contract < Dry::Validation::Contract
    params do
      optional(:sensor_package_name).filled(:string)
      optional(:start_datetime).filled(:date_time)
      optional(:end_datetime).filled(:date_time)
      optional(:tags).array(:string)
    end

    rule(:end_datetime, :start_datetime) do
      if values[:start_datetime] && values[:end_datetime]
        if values[:end_datetime] <= values[:start_datetime]
          key(:end_datetime).failure('must be greater than start_datetime')
        end
      end
    end
  end
end
