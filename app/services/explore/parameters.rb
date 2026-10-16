module Explore
  # The parameter filter of the explore map: one catalogue entry per filter
  # chip, and what a selection of chips means for each source.
  #
  # AirBeam spellings come from inverting Sensor::CANONICAL_SENSOR_NAME_MAP, so
  # a stream matches whether it was stored under its model-prefixed name
  # (AirBeamMini-PM2.5) or the canonical one (AirBeam-PM2.5) — the v3 creator
  # stores sensor_name verbatim and accepts both.
  class Parameters
    CATALOGUE = {
      'pm' => { airbeam: 'AirBeam-PM2.5', government: 'PM2.5' },
      'no2' => { airbeam: nil, government: 'NO2' },
      'ozone' => { airbeam: nil, government: 'Ozone' },
      'temperature' => { airbeam: 'AirBeam-F', government: nil },
      'humidity' => { airbeam: 'AirBeam-RH', government: nil },
    }.freeze

    KEYS = CATALOGUE.keys.freeze

    # canonical name => every lowercased spelling stored for it
    AIRBEAM_SPELLINGS =
      Sensor::CANONICAL_SENSOR_NAME_MAP
        .group_by { |_name, canonical| canonical }
        .transform_values { |pairs| pairs.map { |name, _| name.downcase } }
        .freeze

    class UnknownParameter < ArgumentError
    end

    # An empty selection means every parameter.
    def self.select(keys)
      new(keys)
    end

    attr_reader :keys

    def initialize(keys)
      keys = Array(keys)
      unknown = keys - KEYS
      if unknown.any?
        raise UnknownParameter, "unknown parameters: #{unknown.join(', ')}"
      end

      @keys = keys.empty? ? KEYS : KEYS & keys
    end

    # Lowercased, for matching LOWER(streams.sensor_name).
    def airbeam_sensor_names
      airbeam_parameter_by_sensor_name.keys
    end

    def government_measurement_types
      government_parameter_by_measurement_type.keys
    end

    # False when no selected parameter exists for the source, so its query can
    # be skipped — AirBeams measure no NO2 or ozone, and no government
    # temperature or humidity is stored.
    def airbeam?
      airbeam_sensor_names.any?
    end

    def government?
      government_measurement_types.any?
    end

    def parameter_for_airbeam(sensor_name)
      airbeam_parameter_by_sensor_name[sensor_name.to_s.downcase]
    end

    def parameter_for_government(measurement_type)
      government_parameter_by_measurement_type[measurement_type]
    end

    private

    def airbeam_parameter_by_sensor_name
      @airbeam_parameter_by_sensor_name ||=
        keys.each_with_object({}) do |key, map|
          canonical = CATALOGUE[key][:airbeam]
          next unless canonical

          AIRBEAM_SPELLINGS.fetch(canonical).each { |name| map[name] = key }
        end
    end

    def government_parameter_by_measurement_type
      @government_parameter_by_measurement_type ||=
        keys.each_with_object({}) do |key, map|
          measurement_type = CATALOGUE[key][:government]
          map[measurement_type] = key if measurement_type
        end
    end
  end
end
