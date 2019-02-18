class FixedRegionInfo
  def call(data)
    streams_ids = streams_ids(data[:session_ids], data[:sensor_name])
    last_measurement_time = last_measurement_time(streams_ids)

    {
      average: calculate_average(streams_ids, last_measurement_time).to_f,
      number_of_contributors: number_of_contributors(streams_ids),
      top_contributors: top_contributors(streams_ids, last_measurement_time),
      number_of_samples: number_of_samples(streams_ids, last_measurement_time),
      number_of_instruments: streams_ids.count,
    }
  end

  private

  def streams_ids(sessions, sensor_name)
    Stream.
      select("id").
      where(sensor_name: sensor_name, session_id: sessions)
  end

  def last_measurement_time(streams_ids)
    Measurement.with_streams(streams_ids).last.time
  end

  def calculate_average(streams_ids, end_time)
    streams_ids
    .map { |stream_id| one_hour_average(stream_id, end_time) }
    .sum / streams_ids.size
  end

  def one_hour_average(stream_id, end_time)
    Measurement.
      with_streams(stream_id).
      where(time: (end_time - 1.hour)..end_time).
      average(:value)
  end

  def number_of_contributors(streams_ids)
    Measurement.
      with_streams(streams_ids).
      joins(:session).
      select("DISTINCT user_id").
      count
  end

  def top_contributors(streams_ids, end_time)
    Measurement.
      unscoped.   # this removes the default_scope { order("time ASC") } that we have for measurements
      where(time: (end_time - 1.hour)..end_time).
      with_streams(streams_ids).
      joins(:session => :user).
      group("users.id").
      order("count(*) DESC").
      limit(10).
      select(:username).
      map(&:username)
  end

  def number_of_samples(streams_ids, end_time)
    Measurement.
      with_streams(streams_ids).
      where(time: (end_time - 1.hour)..end_time).
      count
  end
end
