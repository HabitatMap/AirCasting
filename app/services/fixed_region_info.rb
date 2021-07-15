class FixedRegionInfo
  def call(data)
    streams_ids = streams_ids(data)
    stats = calculate_stats(streams_ids)

    {
      average: stats[:average],
      number_of_contributors: number_of_contributors(streams_ids),
      number_of_samples: stats[:count],
      number_of_instruments: streams_ids.count
    }
  end

  private

  def streams_ids(data)
    Stream
      .select('id')
      .where(sensor_name: data[:sensor_name], session_id: data[:session_ids])
  end

  def calculate_stats(streams_ids)
    streams_ids.reduce({ average: 0, count: 0 }) do |acc, stream_id|
      end_time = end_time(stream_id)

      stats =
        Measurement
          .with_streams(stream_id)
          .where(time: (end_time - 1.hour)..end_time)
          .select('AVG(value) as average, count(*) as count')
          .first

      acc[:average] += stats.average.fdiv(streams_ids.length)
      acc[:count] += stats.count
      acc
    end
  end

  def number_of_contributors(streams_ids)
    Measurement
      .with_streams(streams_ids)
      .joins(:session)
      .select('DISTINCT user_id')
      .count
  end

  def end_time(stream_id)
    Measurement.with_streams(stream_id).maximum(:time)
  end
end
