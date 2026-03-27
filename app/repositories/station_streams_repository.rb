class StationStreamsRepository
  SENSOR_NAME_TO_MEASUREMENT_TYPE = {
    'government-pm2.5' => 'PM2.5',
    'government-no2' => 'NO2',
    'government-ozone' => 'Ozone',
  }.freeze

  def find(id)
    StationStream.includes(:stream_configuration, :source).find_by(id: id)
  end

  def active_in_rectangle(sensor_name:, west:, east:, north:, south:, time_from: nil, time_to: nil)
    measurement_type = SENSOR_NAME_TO_MEASUREMENT_TYPE[sensor_name.downcase]
    return [] unless measurement_type

    query = StationStream
      .select('station_streams.*, station_measurements.value AS last_measurement_value')
      .joins(:stream_configuration)
      .joins(
        'JOIN station_measurements ON station_measurements.station_stream_id = station_streams.id
         AND station_measurements.measured_at = station_streams.last_measured_at',
      )
      .includes(:stream_configuration)
      .where(stream_configurations: { measurement_type: measurement_type })
      .where('station_streams.last_measured_at > ?', StationStream::ACTIVE_FOR.ago)
      .where('ST_Y(station_streams.location::geometry) BETWEEN ? AND ?', south, north)
      .where(
        '(? <= ? AND ST_X(station_streams.location::geometry) BETWEEN ? AND ?)
         OR
         (? > ? AND (ST_X(station_streams.location::geometry) >= ? OR ST_X(station_streams.location::geometry) <= ?))',
        west, east, west, east,
        west, east, west, east,
      )

    if time_from && time_to
      query = query.where(
        '(station_streams.first_measured_at BETWEEN :time_from AND :time_to)
         OR (station_streams.last_measured_at BETWEEN :time_from AND :time_to)
         OR (:time_from BETWEEN station_streams.first_measured_at AND station_streams.last_measured_at)',
        time_from: time_from,
        time_to: time_to,
      )
    end

    query.order(id: :asc)
  end

  def dormant_in_rectangle(sensor_name:, west:, east:, north:, south:, time_from: nil, time_to: nil)
    measurement_type = SENSOR_NAME_TO_MEASUREMENT_TYPE[sensor_name.downcase]
    return [] unless measurement_type

    query = StationStream
      .select('station_streams.*, station_measurements.value AS last_measurement_value')
      .joins(:stream_configuration)
      .joins(
        'JOIN station_measurements ON station_measurements.station_stream_id = station_streams.id
         AND station_measurements.measured_at = station_streams.last_measured_at',
      )
      .includes(:stream_configuration)
      .where(stream_configurations: { measurement_type: measurement_type })
      .where('station_streams.last_measured_at <= ?', StationStream::ACTIVE_FOR.ago)
      .where('ST_Y(station_streams.location::geometry) BETWEEN ? AND ?', south, north)
      .where(
        '(? <= ? AND ST_X(station_streams.location::geometry) BETWEEN ? AND ?)
         OR
         (? > ? AND (ST_X(station_streams.location::geometry) >= ? OR ST_X(station_streams.location::geometry) <= ?))',
        west, east, west, east,
        west, east, west, east,
      )

    if time_from && time_to
      query = query.where(
        '(station_streams.first_measured_at BETWEEN :time_from AND :time_to)
         OR (station_streams.last_measured_at BETWEEN :time_from AND :time_to)
         OR (:time_from BETWEEN station_streams.first_measured_at AND station_streams.last_measured_at)',
        time_from: time_from,
        time_to: time_to,
      )
    end

    query.order(id: :asc)
  end

  def active_in_last_7_days_in_rectangle(sensor_name:, west:, east:, north:, south:)
    measurement_type = SENSOR_NAME_TO_MEASUREMENT_TYPE[sensor_name.downcase]
    return StationStream.none unless measurement_type

    query =
      StationStream
        .joins(:stream_configuration)
        .where(
          stream_configurations: {
            measurement_type: measurement_type,
            canonical: true,
          },
        )
        .where('station_streams.last_measured_at > ?', 7.days.ago)
        .where(
          'ST_Y(station_streams.location::geometry) BETWEEN ? AND ?',
          south,
          north,
        )

    if west <= east
      query.where(
        'ST_X(station_streams.location::geometry) BETWEEN ? AND ?',
        west,
        east,
      )
    else
      query.where(
        'ST_X(station_streams.location::geometry) >= ? OR ST_X(station_streams.location::geometry) <= ?',
        west,
        east,
      )
    end
  end
end
