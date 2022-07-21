module PurpleAir
  LAST_SEEN = 'last_seen'
  LATITUDE = 'latitude'
  LONGITUDE = 'longitude'
  NAME = 'name'
  SENSOR_INDEX = 'sensor_index'
  VALUE = 'pm2.5_10minute_a'
  FIELD_NAMES = {
    last_seen: LAST_SEEN,
    latitude: LATITUDE,
    longitude: LONGITUDE,
    name: NAME,
    sensor_index: SENSOR_INDEX,
    value: VALUE,
  }
  ORDERED_FIELDS = [SENSOR_INDEX, LAST_SEEN, NAME, LATITUDE, LONGITUDE, VALUE]

  class ImportMeasurements
    def initialize(
      fetch_measurements: PurpleAir::FetchMeasurements.new(ordered_fields: ORDERED_FIELDS),
      utc_to_local: PurpleAir::UtcToLocal.new
    )
      @fetch_measurements = fetch_measurements
      @parse_fields = ParseFields.new(
        field_names: FIELD_NAMES,
        ordered_fields: ORDERED_FIELDS,
        utc_to_local: utc_to_local
      )
      @save_measurements = SaveMeasurements.new(user: User.where(username: 'PurpleAir').first!)
    end

    def call
      measurements_fields = @fetch_measurements.call
      parsed = @parse_fields.call(measurements_fields)
      streams = GroupByStream.new.call(measurements: parsed)
      @save_measurements.call(streams: streams)
    end
  end
end
