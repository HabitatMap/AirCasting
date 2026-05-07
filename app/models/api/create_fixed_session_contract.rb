module Api
  class CreateFixedSessionContract < Dry::Validation::Contract
    params do
      required(:uuid).filled(:string)
      required(:title).filled(:string)
      required(:latitude).filled(:float)
      required(:longitude).filled(:float)
      required(:contribute).filled(:bool)
      optional(:is_indoor).maybe(:bool)
      required(:airbeam).hash do
        required(:mac_address).filled(:string)
        required(:model).filled(:string)
        optional(:name).maybe(:string)
      end
      required(:streams).array(:hash) do
        required(:sensor_name).filled(:string)
        required(:unit_symbol).filled(:string)
      end
    end

    rule(:streams) do
      key.failure('must have at least one stream') if value.empty?
    end

    rule(:streams) do
      value.each_with_index do |stream, i|
        canonical = Sensor.canonical_sensor_name(stream[:sensor_name])

        unless Sensor::CANONICAL_SENSOR_TYPE_IDS.key?(canonical)
          key([:streams, i, :sensor_name]).failure("'#{stream[:sensor_name]}' is not a supported sensor type")
          next
        end

        expected_unit = Sensor::CANONICAL_UNIT_SYMBOLS[canonical]
        if stream[:unit_symbol] != expected_unit
          key([:streams, i, :unit_symbol]).failure(
            "expected '#{expected_unit}' for #{canonical}, got '#{stream[:unit_symbol]}'",
          )
        end
      end
    end
  end
end
