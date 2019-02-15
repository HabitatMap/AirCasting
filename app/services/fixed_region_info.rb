class FixedRegionInfo
  def call(data)
    streams_ids = streams_ids(data[:session_ids], data[:sensor_name])

    {
      average: calculate_average(data[:session_ids], data[:sensor_name]).to_f,
      number_of_contributors: number_of_contributors(streams_ids),
      top_contributors: top_contributors(streams_ids),
      number_of_samples: number_of_samples(streams_ids),
      number_of_instruments: data[:session_ids].count,
    }
  end

  private

  def calculate_average(sessions_ids, sensor_name)
    sessions_ids
    .map { |session_id| last_hour_average_for(session_id, sensor_name) }
    .sum / sessions_ids.size
  end

  def last_hour_average_for(session_id, sensor_name)
    stream = Stream.where(sensor_name: sensor_name, session_id: session_id).first
    last_measurement_time = stream.measurements.last.time

    stream.
      measurements.
      where(time: (last_measurement_time - 1.hour)..last_measurement_time).
      average(:value)
  end

  def number_of_contributors(streams_ids)
    Measurement.
      with_streams(streams_ids).
      joins(:session).
      select("DISTINCT user_id").
      count
  end

  def top_contributors(streams_ids)
    Measurement.
      unscoped.   # this removes the default_scope { order("time ASC") } that we have for measurements
      with_streams(streams_ids).
      joins(:session => :user).
      group("users.id").
      order("count(*) DESC").
      limit(10).
      select(:username).
      map(&:username)
  end

  def number_of_samples(streams_ids)
    Measurement.
      with_streams(streams_ids).
      count
  end

  def streams_ids(sessions, sensor_name)
    Stream.
      select("id").
      where(sensor_name: sensor_name, session_id: sessions)
  end
end
