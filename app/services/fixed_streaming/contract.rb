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

      required(:measurements).array do
        filter(:hash) do
          required(:longitude).filled(:float)
          required(:latitude).filled(:float)
          required(:time).filled(:string)
          required(:value).filled(:integer)
        end
      end
    end

    rule(:measurements).each do |measurement|
      begin
        parsed_time = DateTime.parse(measurement[:time])
      rescue ArgumentError
        measurement.failure('must be a valid datetime')
        next
      end

      time_limit = Time.current + 2.days
      if parsed_time > time_limit
        measurement.failure('cannot be more than 2 days in the future')
      end
    end
  end
end
