class FixedRegionInfo
  def call(data)
    streams_ids = streams_ids(data)
    last_measurement_time = last_measurement_time(streams_ids)

     {
      average: calculate_average(streams_ids, last_measurement_time).to_f,
      number_of_contributors: number_of_contributors(streams_ids),
      number_of_samples: number_of_samples(streams_ids, last_measurement_time),
      number_of_instruments: streams_ids.count,
    }
  end

   private

   def streams_ids(data)
    Stream.
      select("id").
      where(sensor_name: data[:sensor_name], session_id: data[:session_ids])
  end

   def last_measurement_time(streams_ids)
    Measurement.with_streams(streams_ids).select("MAX(time) as last_time").first.last_time
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
      average(:value) || 0
  end

   def number_of_contributors(streams_ids)
    Measurement.
      with_streams(streams_ids).
      joins(:session).
      select("DISTINCT user_id").
      count
  end

   def number_of_samples(streams_ids, end_time)
    Measurement.
      with_streams(streams_ids).
      where(time: (end_time - 1.hour)..end_time).
      count
  end
end
