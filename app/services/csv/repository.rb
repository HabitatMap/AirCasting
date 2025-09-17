class Csv::Repository
  def find_stream_parameters(session_id, sensor_package_name)
    hash = {
      'sensor_names' => [],
      'measurement_types' => [],
      'measurement_units' => [],
    }

    find_streams(session_id, sensor_package_name)
      .to_a
      .each do |h|
        hash['sensor_names'].push(h['sensor_name'])
        hash['measurement_types'].push(h['measurement_type'])
        hash['measurement_units'].push(h['unit_name'])
      end

    hash
  end

  def count_streams(session_id, sensor_package_name)
    find_streams(session_id, sensor_package_name).rows.size
  end

  def find_measurements(session_id, sensor_package_name)
    session = Session.find(session_id)
    sanitized_package_name = sanitized_package_name(sensor_package_name)

    if session.type == 'FixedSession'
      find_fixed_measurements(session_id, sanitized_package_name)
    else
      find_mobile_measurements(session_id, sanitized_package_name)
    end
  end

  def find_sensor_package_names(session_id)
    sql = <<-SQL
      SELECT streams.sensor_package_name as stream_sensor_package_name
      FROM sessions
      INNER JOIN streams ON streams.session_id = sessions.id
      WHERE sessions.id = '#{session_id}'
      GROUP BY streams.sensor_package_name
      ORDER BY streams.sensor_package_name
    SQL

    ActiveRecord::Base
      .connection
      .exec_query(sql)
      .to_a
      .map { |h| h['stream_sensor_package_name'] }
  end

  def find_notes(session_id)
    Note.where(session_id: session_id).order(date: :asc)
  end

  def find_session_title(session_id)
    sql = <<-SQL
      SELECT sessions.title
      FROM sessions
      WHERE sessions.id = '#{session_id}'
    SQL

    ActiveRecord::Base.connection.exec_query(sql).to_a.first['title']
  end

  private

  def sanitized_package_name(sensor_package_name)
    sensor_package_name.gsub("'", "''")
  end

  def find_streams(session_id, sensor_package_name)
    sql = <<-SQL
      SELECT streams.sensor_name, streams.sensor_package_name, streams.measurement_type, streams.unit_name
      FROM streams
      WHERE streams.session_id = '#{session_id}'
      AND streams.sensor_package_name = '#{sanitized_package_name(sensor_package_name)}'
      GROUP BY streams.sensor_name, streams.sensor_package_name, streams.measurement_type, streams.unit_name
      ORDER BY streams.sensor_name ASC
    SQL

    ActiveRecord::Base.connection.exec_query(sql)
  end

  def find_mobile_measurements(session_id, sanitized_package_name)
    sql = <<-SQL
      SELECT streams.sensor_package_name as stream_sensor_package_name, streams.sensor_name as stream_sensor_name,
      streams.measurement_type as stream_measurement_type, streams.unit_name as stream_unit_name,
      sessions.title as session_title, measurements.time as measurement_time,
      measurements.milliseconds as measurement_milliseconds, measurements.latitude as measurement_latitude,
      measurements.longitude as measurement_longitude, measurements.value as measurement_value
      FROM sessions
      INNER JOIN streams ON streams.session_id = sessions.id
      INNER JOIN measurements ON measurements.stream_id = streams.id
      WHERE sessions.id = '#{session_id}'
      AND streams.sensor_package_name = '#{sanitized_package_name}'
      ORDER BY measurements.time, measurements.milliseconds, streams.sensor_name ASC
    SQL

    ActiveRecord::Base.connection.exec_query(sql).to_a
  end

  def find_fixed_measurements(session_id, sanitized_package_name)
    sql = <<-SQL
      SELECT streams.sensor_package_name as stream_sensor_package_name, streams.sensor_name as stream_sensor_name,
      streams.measurement_type as stream_measurement_type, streams.unit_name as stream_unit_name,
      sessions.title as session_title, fixed_measurements.time as measurement_time,
      0 as measurement_milliseconds, sessions.latitude as measurement_latitude,
      sessions.longitude as measurement_longitude, fixed_measurements.value as measurement_value
      FROM sessions
      INNER JOIN streams ON streams.session_id = sessions.id
      INNER JOIN fixed_measurements ON fixed_measurements.stream_id = streams.id
      WHERE sessions.id = '#{session_id}'
      AND streams.sensor_package_name = '#{sanitized_package_name}'
      ORDER BY fixed_measurements.time, streams.sensor_name ASC
    SQL

    ActiveRecord::Base.connection.exec_query(sql).to_a
  end
end
