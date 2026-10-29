module ThresholdSets
  # The default colour-scale bands a client needs to render any measurement
  # AirCasting serves — one entry per measurement parameter, not per AirBeam
  # model. `AirBeam3-PM2.5` and `AirBeamMini-PM2.5` are the same parameter and
  # share one entry, listed among its `aliases`.
  #
  # Two tables hold bands, and which one owns a parameter is not a detail a
  # client should have to know:
  #
  #   threshold_sets        (sensor_name, unit_symbol)      AirBeam + phone mic
  #   stream_configurations (measurement_type, unit_symbol) government stations
  #
  # Government bands are read from `stream_configurations` rather than from the
  # `Government-*` rows in `threshold_sets`, because that is what
  # `StationStreamSerializer` serves for a station's detail view — sourcing them
  # anywhere else would let the explore map colour a station differently from
  # its own detail screen.
  #
  # Selection is this explicit list, never `where(is_default: true)`. Production
  # has nineteen rows flagged default, including a second `AirBeam3-PM10` whose
  # bands are the sound-level ones and an `AirBeam2-F` carrying humidity values,
  # so the flag does not describe a coherent set.
  class Defaults
    Entry =
      Struct.new(
        :sensor_name,
        :measurement_type,
        :unit_symbol,
        :aliases,
        :thresholds,
        keyword_init: true,
      )

    Bands =
      Struct.new(:very_low, :low, :medium, :high, :very_high, keyword_init: true)

    # Canonical sensor name => the measurement_type reported alongside it. PM1,
    # PM2.5 and PM10 are all 'Particulate Matter', which is why the canonical
    # sensor name is the key here and measurement_type only travels with it.
    AIRBEAM = {
      'AirBeam-PM1' => 'Particulate Matter',
      'AirBeam-PM2.5' => 'Particulate Matter',
      'AirBeam-PM10' => 'Particulate Matter',
      'AirBeam-RH' => 'Humidity',
      'AirBeam-F' => 'Temperature',
      'Phone Microphone' => 'Sound Level',
    }.freeze

    # stream_configurations.measurement_type => the measurement_type name the
    # rest of the API uses. Keys match `Explore::Parameters::CATALOGUE`'s
    # `government:` spellings; PM2.5 is absent because it merges into
    # `AirBeam-PM2.5` below.
    GOVERNMENT = { 'NO2' => 'Nitrogen Dioxide', 'Ozone' => 'Ozone' }.freeze

    # The government parameter whose bands must equal `AirBeam-PM2.5`'s for the
    # two to share one entry. Guarded by a spec rather than by a constraint —
    # the tables are edited independently and nothing stops them drifting.
    SHARED_PM2_5 = 'PM2.5'.freeze

    class MissingDefault < StandardError
    end

    def call
      airbeam_entries + government_entries
    end

    private

    def airbeam_entries
      AIRBEAM.map do |sensor_name, measurement_type|
        unit_symbol = Sensor::CANONICAL_UNIT_SYMBOLS.fetch(sensor_name)
        set = threshold_sets.fetch([sensor_name, unit_symbol]) do
          raise MissingDefault,
                "no default threshold set for #{sensor_name} (#{unit_symbol})"
        end

        Entry.new(
          sensor_name: sensor_name,
          measurement_type: measurement_type,
          unit_symbol: unit_symbol,
          aliases: aliases_for(sensor_name),
          thresholds: bands(set),
        )
      end
    end

    def government_entries
      GOVERNMENT.map do |parameter, measurement_type|
        config = stream_configurations.fetch(parameter) do
          raise MissingDefault,
                "no canonical stream configuration for #{parameter}"
        end

        Entry.new(
          sensor_name: "Government-#{parameter}",
          measurement_type: measurement_type,
          unit_symbol: config.unit_symbol,
          aliases: ["Government-#{parameter}"],
          thresholds: bands(config),
        )
      end
    end

    # Every spelling a stream may be stored under for this parameter, so a
    # client holding a raw device name — `AirBeamMini-PM1` off the BLE line, or
    # `AirBeam2-PM2.5` from a followed session — can resolve it without
    # reimplementing `Sensor::CANONICAL_SENSOR_NAME_MAP`.
    def aliases_for(sensor_name)
      names =
        Sensor::CANONICAL_SENSOR_NAME_MAP
          .select { |_spelling, canonical| canonical == sensor_name }
          .keys

      names |= ["Government-#{SHARED_PM2_5}"] if sensor_name == 'AirBeam-PM2.5'
      names.sort
    end

    def bands(record)
      Bands.new(
        very_low: record.threshold_very_low.to_f,
        low: record.threshold_low.to_f,
        medium: record.threshold_medium.to_f,
        high: record.threshold_high.to_f,
        very_high: record.threshold_very_high.to_f,
      )
    end

    # One row per (sensor_name, unit_symbol). `is_default` is not trustworthy on
    # its own, but among rows already carrying a canonical sensor name it is the
    # only thing separating the default from the user-supplied sets that
    # `MobileSessions::Creator#resolve_threshold_set` creates under the same
    # name. Flagged row first, then lowest id — so a parameter whose flag was
    # never set still answers, with the oldest and by far most-used row.
    def threshold_sets
      @threshold_sets ||=
        ThresholdSet
          .select('DISTINCT ON (sensor_name, unit_symbol) threshold_sets.*')
          .where(sensor_name: AIRBEAM.keys)
          .order(
            Arel.sql(
              'sensor_name, unit_symbol, is_default DESC NULLS LAST, id ASC',
            ),
          )
          .index_by { |set| [set.sensor_name, set.unit_symbol] }
    end

    def stream_configurations
      @stream_configurations ||=
        StreamConfiguration
          .where(canonical: true)
          .index_by(&:measurement_type)
    end
  end
end
