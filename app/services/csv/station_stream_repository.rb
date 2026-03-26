class Csv::StationStreamRepository
  def find_stream_parameters(station_stream_id)
    row = fetch_stream_config(station_stream_id)
    return {} unless row

    display = display_names(row['measurement_type'])
    {
      'sensor_names' => [display[:sensor_name]],
      'measurement_types' => [display[:measurement_type]],
      'measurement_units' => [display[:unit_name]],
    }
  end

  def find_sensor_package_name(station_stream_id)
    row = fetch_stream_config(station_stream_id)
    return nil unless row

    display_names(row['measurement_type'])[:sensor_name]
  end

  def find_measurements(station_stream_id)
    sql = <<-SQL
      SELECT
        stream_configurations.measurement_type AS measurement_type_key,
        station_streams.title AS session_title,
        station_measurements.measured_at AT TIME ZONE station_streams.time_zone AS measurement_time,
        0 AS measurement_milliseconds,
        ST_Y(station_streams.location::geometry) AS measurement_latitude,
        ST_X(station_streams.location::geometry) AS measurement_longitude,
        station_measurements.value AS measurement_value
      FROM station_streams
      INNER JOIN station_measurements ON station_measurements.station_stream_id = station_streams.id
      INNER JOIN stream_configurations ON stream_configurations.id = station_streams.stream_configuration_id
      WHERE station_streams.id = #{station_stream_id.to_i}
      ORDER BY station_measurements.measured_at ASC
    SQL

    ActiveRecord::Base.connection.exec_query(sql).to_a.map do |row|
      display = display_names(row['measurement_type_key'])
      row.merge(
        'stream_sensor_package_name' => display[:sensor_name],
        'stream_sensor_name' => display[:sensor_name],
        'stream_measurement_type' => display[:measurement_type],
        'stream_unit_name' => display[:unit_name],
      )
    end
  end

  private

  def fetch_stream_config(station_stream_id)
    sql = <<-SQL
      SELECT stream_configurations.measurement_type AS measurement_type
      FROM station_streams
      INNER JOIN stream_configurations ON stream_configurations.id = station_streams.stream_configuration_id
      WHERE station_streams.id = #{station_stream_id.to_i}
    SQL

    ActiveRecord::Base.connection.exec_query(sql).to_a.first
  end

  def stream_defaults
    @stream_defaults ||= GovernmentSources::StreamDefaults.new.call
  end

  def display_names(measurement_type)
    stream_defaults.fetch(measurement_type) do
      {
        sensor_name: "Government-#{measurement_type}",
        measurement_type: measurement_type,
        unit_name: measurement_type,
      }
    end
  end
end
