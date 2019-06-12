class FixedRegionInfo
  def call(data)
    streams_ids = streams_ids(data)

     {
      average: calculate_average(streams_ids).to_f,
      number_of_contributors: number_of_contributors(streams_ids),
      number_of_samples: number_of_samples(streams_ids),
      number_of_instruments: streams_ids.count,
    }
  end

  private

  def streams_ids(data)
    Stream.
      select("id").
      where(sensor_name: data[:sensor_name], session_id: data[:session_ids])
  end

  def calculate_average(streams_ids)
    streams_ids.reduce(0) do |acc, stream_id|
      acc + one_hour_average(stream_id, end_time(stream_id))
    end / streams_ids.length
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

  def number_of_samples(streams_ids)
     streams_ids.reduce(0) do |acc, stream_id|
      end_time = end_time(stream_id)

      acc + Measurement.with_streams(stream_id).where(time: (end_time - 1.hour)..end_time).count
    end
  end

  def end_time(stream_id)
    Measurement.with_streams(stream_id).select("MAX(time) as last_time").first.last_time
  end
end
