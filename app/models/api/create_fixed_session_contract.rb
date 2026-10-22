module Api
  class CreateFixedSessionContract < Dry::Validation::Contract
    # RFC 4122 canonical form — both apps generate uuids this way
    # (Android `UUID.randomUUID`, iOS `UUID`).
    UUID_FORMAT = /\A\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\z/

    params do
      required(:uuid).filled(:string)
      required(:title).filled(:string)
      required(:latitude).filled(:float)
      required(:longitude).filled(:float)
      required(:contribute).filled(:bool)
      optional(:is_indoor).maybe(:bool)
      optional(:time_zone).maybe(:string)
      # `mac_address` is a *device identifier*, not necessarily a hardware MAC:
      # custom integrations should send whatever stable id their hardware has,
      # and `model` is a free string, not an AirBeam enum.
      required(:device).hash do
        required(:mac_address).filled(:string)
        required(:model).filled(:string)
        optional(:name).maybe(:string)
      end

      # LEGACY: shipped app versions send this object as `airbeam`. Accepted as an
      # alias so they keep working; everything downstream sees `device`.
      before(:key_coercer) do |result|
        hash = result.to_h
        hash[:device] = hash.delete(:airbeam) if hash.key?(:airbeam) && !hash.key?(:device)
        hash
      end
      required(:streams).array(:hash) do
        required(:sensor_name).filled(:string)
        required(:unit_symbol).filled(:string)
        optional(:thresholds).hash do
          required(:very_low).filled(:float)
          required(:low).filled(:float)
          required(:medium).filled(:float)
          required(:high).filled(:float)
          required(:very_high).filled(:float)
        end
      end
    end

    rule(:streams) do
      key.failure(text: 'must have at least one stream', code: 'empty') if value.empty?
    end

    rule(:streams) do
      value.each_with_index do |stream, i|
        thresholds = stream[:thresholds]
        next if thresholds.blank?

        ordered = thresholds.values_at(:very_low, :low, :medium, :high, :very_high)
        if ordered.each_cons(2).any? { |a, b| a > b }
          key([:streams, i, :thresholds]).failure(
            text: 'must be in ascending order (very_low ≤ low ≤ medium ≤ high ≤ very_high)',
            code: 'out_of_order',
          )
        end
      end
    end

    # Shape only — whether the uuid is already taken depends on stored state, so
    # FixedSessions::Creator checks that and answers with `session_uuid_taken`.
    rule(:uuid) do
      if key? && value && !UUID_FORMAT.match?(value)
        key.failure(
          text: 'must be a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)',
          code: 'invalid_format',
          params: { format: 'uuid' },
        )
      end
    end

    rule(:time_zone) do
      if key? && value
        begin
          TZInfo::Timezone.get(value)
        rescue TZInfo::InvalidTimezoneIdentifier
          key.failure(
            text: 'must be a valid IANA time zone identifier (e.g. Europe/Warsaw)',
            code: 'invalid_format',
            params: { format: 'iana_time_zone' },
          )
        end
      end
    end

    rule(:streams) do
      # A session holds at most one stream per sensor type (unique index on
      # streams.session_id + sensor_type_id), and the AirBeam addresses streams
      # by that id in the binary upload — two of one type would be unaddressable.
      seen = {}

      value.each_with_index do |stream, i|
        canonical = Sensor.canonical_sensor_name(stream[:sensor_name])

        unless Sensor::CANONICAL_SENSOR_TYPE_IDS.key?(canonical)
          key([:streams, i, :sensor_name]).failure(
            text: "'#{stream[:sensor_name]}' is not a supported sensor type",
            code: 'unsupported_sensor_type',
            params: { sensor_name: stream[:sensor_name].to_s },
          )
          next
        end

        if seen.key?(canonical)
          key([:streams, i, :sensor_name]).failure(
            text: "duplicates the #{canonical} stream already requested at index #{seen[canonical]}",
            code: 'duplicate',
            params: { sensor_name: canonical, index: seen[canonical] },
          )
          next
        end
        seen[canonical] = i

        expected_unit = Sensor::CANONICAL_UNIT_SYMBOLS[canonical]
        if stream[:unit_symbol] != expected_unit
          key([:streams, i, :unit_symbol]).failure(
            text: "expected '#{expected_unit}' for #{canonical}, got '#{stream[:unit_symbol]}'",
            code: 'unexpected_unit',
            params: { expected: expected_unit, sensor_name: canonical },
          )
        end
      end
    end
  end
end
