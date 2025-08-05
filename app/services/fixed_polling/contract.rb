module FixedPolling
  class Contract < Dry::Validation::Contract
    params do
      required(:uuid).filled(:string)
      required(:last_measurement_sync).filled(:date_time)

      before(:key_coercer) do |result|
        if result[:last_measurement_sync].is_a?(String)
          begin
            decoded = CGI.unescape(result[:last_measurement_sync])
            result.update(last_measurement_sync: decoded)
          rescue ArgumentError
          end
        end

        result
      end
    end
  end
end
