module Api
  class CreateMobileSessionContract < Dry::Validation::Contract
    # RFC 4122 canonical form — both apps generate uuids this way
    # (Android `UUID.randomUUID`, iOS `UUID`).
    UUID_FORMAT = /\A\h{8}-\h{4}-\h{4}-\h{4}-\h{12}\z/

    # Metadata a custom sensor must carry, because the server cannot infer it.
    CUSTOM_SENSOR_FIELDS = %i[measurement_type measurement_short_type unit_name].freeze
    # Well above the longest value in production (41 chars) and short enough to
    # keep the public sensor list readable.
    MAX_SENSOR_FIELD_LENGTH = 64
    # Names that resolve to a server-known sensor, in any casing.
    BUILTIN_SENSOR_NAMES = (
      Sensor::CANONICAL_SENSOR_NAME_MAP.keys + Sensor::CANONICAL_SENSOR_TYPE_IDS.keys
    ).map(&:downcase).uniq.freeze

    params do
      required(:uuid).filled(:string)
      required(:title).filled(:string)
      required(:time_zone).filled(:string)
      required(:contribute).filled(:bool)
      optional(:tag_list).maybe(:string)
      optional(:latitude).maybe(:float)
      optional(:longitude).maybe(:float)
      # `mac_address` is a *device identifier*, not necessarily a hardware MAC:
      # custom integrations should send whatever stable id their hardware has,
      # and `model` is a free string, not an AirBeam enum.
      required(:device).hash do
        required(:mac_address).filled(:string)
        required(:model).filled(:string)
        optional(:name).maybe(:string)
      end
      required(:streams).array(:hash) do
        required(:sensor_name).filled(:string)
        required(:unit_symbol).filled(:string)
        # Required for sensors the server does not know (see the streams rule);
        # ignored for known ones, whose metadata is server-owned.
        optional(:measurement_type).filled(:string)
        optional(:measurement_short_type).filled(:string)
        optional(:unit_name).filled(:string)
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
      key.failure('must have at least one stream') if value.empty?
    end

    rule(:streams) do
      value.each_with_index do |stream, i|
        thresholds = stream[:thresholds]
        next if thresholds.blank?

        ordered = thresholds.values_at(:very_low, :low, :medium, :high, :very_high)
        if ordered.each_cons(2).any? { |a, b| a > b }
          key([:streams, i, :thresholds]).failure(
            'must be in ascending order (very_low ≤ low ≤ medium ≤ high ≤ very_high)',
          )
        end
      end
    end

    # Shape only — whether the uuid is already taken depends on stored state, so
    # MobileSessions::Creator checks that and answers with `session_uuid_taken`.
    rule(:uuid) do
      if key? && value && !UUID_FORMAT.match?(value)
        key.failure('must be a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000)')
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
      # Two tiers. A sensor the server knows (`Sensor::CANONICAL_SENSOR_TYPE_IDS`)
      # is described entirely server-side — the client sends only a name and unit.
      # Anything else is a custom integration: it may be uploaded, but the client
      # has to describe it, because nothing else can.
      #
      # A session holds at most one stream per sensor type (unique index on
      # streams.session_id + sensor_type_id), and the binary upload addresses
      # streams by that id, so a type may appear only once either way.
      seen = {}

      value.each_with_index do |stream, i|
        name = stream[:sensor_name].to_s.strip
        canonical = Sensor.canonical_sensor_name(name)
        known = Sensor::CANONICAL_SENSOR_TYPE_IDS.key?(canonical)

        if seen.key?(canonical)
          key([:streams, i, :sensor_name]).failure(
            "duplicates the #{canonical} stream already requested at index #{seen[canonical]}",
          )
          next
        end
        seen[canonical] = i

        if known
          expected_unit = Sensor::CANONICAL_UNIT_SYMBOLS[canonical]
          if stream[:unit_symbol] != expected_unit
            key([:streams, i, :unit_symbol]).failure(
              "expected '#{expected_unit}' for #{canonical}, got '#{stream[:unit_symbol]}'",
            )
          end
          next
        end

        # --- custom sensor ---
        CUSTOM_SENSOR_FIELDS.each do |field|
          next if stream[field].to_s.strip.present?

          key([:streams, i, field]).failure(
            "is required for '#{name}', which is not a sensor the server knows",
          )
        end

        (CUSTOM_SENSOR_FIELDS + %i[sensor_name unit_symbol]).each do |field|
          text = stream[field].to_s.strip
          next if text.empty? || text.length <= MAX_SENSOR_FIELD_LENGTH

          key([:streams, i, field]).failure("must be at most #{MAX_SENSOR_FIELD_LENGTH} characters")
        end

        if BUILTIN_SENSOR_NAMES.include?(name.downcase)
          key([:streams, i, :sensor_name]).failure(
            "'#{name}' is a built-in sensor name — send it with its own unit and no custom metadata",
          )
        end
      end
    end
  end
end
