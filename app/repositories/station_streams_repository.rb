class StationStreamsRepository
  SENSOR_NAME_TO_MEASUREMENT_TYPE = {
    'government-pm2.5' => 'PM2.5',
    'government-no2' => 'NO2',
    'government-ozone' => 'Ozone',
  }.freeze

  def active_in_rectangle(sensor_name:, west:, east:, north:, south:)
    measurement_type = SENSOR_NAME_TO_MEASUREMENT_TYPE[sensor_name.downcase]
    return [] unless measurement_type

    StationStream
      .select('station_streams.*, station_measurements.value AS last_measurement_value')
      .joins(:stream_configuration)
      .joins(
        'JOIN station_measurements ON station_measurements.station_stream_id = station_streams.id
         AND station_measurements.measured_at = station_streams.last_measured_at',
      )
      .includes(:stream_configuration)
      .where(stream_configurations: { measurement_type: measurement_type })
      .where('station_streams.last_measured_at > ?', 24.hours.ago)
      .where('ST_Y(station_streams.location::geometry) BETWEEN ? AND ?', south, north)
      .where(
        '(? <= ? AND ST_X(station_streams.location::geometry) BETWEEN ? AND ?)
         OR
         (? > ? AND (ST_X(station_streams.location::geometry) >= ? OR ST_X(station_streams.location::geometry) <= ?))',
        west, east, west, east,
        west, east, west, east,
      )
      .order(id: :asc)
  end
end
