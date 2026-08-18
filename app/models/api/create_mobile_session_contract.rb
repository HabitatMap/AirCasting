module Api
  class CreateMobileSessionContract < Dry::Validation::Contract
    # RFC 4122 canonical form — both apps generate uuids this way
    # (Android `UUID.randomUUID`, iOS `UUID`).
    UUID_FORMAT = /\A\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\z/

    params do
      required(:uuid).filled(:string)
      required(:title).filled(:string)
      required(:time_zone).filled(:string)
      required(:contribute).filled(:bool)
      optional(:tag_list).maybe(:string)
      optional(:latitude).maybe(:float)
      optional(:longitude).maybe(:float)
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

    rule(:uuid) do
      next unless key? && value

      if !UUID_FORMAT.match?(value)
        key.failure('must be a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)')
      elsif Session.where('LOWER(uuid) = LOWER(?)', value).exists?
        key.failure('has already been taken')
      end
    end

    rule(:time_zone) do
      if key? && value
        begin
          TZInfo::Timezone.get(value)
        rescue TZInfo::InvalidTimezoneIdentifier
          key.failure('must be a valid IANA time zone identifier (e.g. Europe/Warsaw)')
        end
      end
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
