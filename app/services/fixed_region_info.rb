class FixedRegionInfo
  def call(stream_ids)
    stats = calculate_stats(stream_ids)

    {
      average: stats[:average],
      number_of_contributors: number_of_contributors(stream_ids),
      number_of_samples: stats[:count],
      number_of_instruments: stream_ids.count,
    }
  end

  private

  def calculate_stats(stream_ids)
    stream_ids.reduce({ average: 0, count: 0 }) do |acc, stream_id|
      end_time = end_time(stream_id)

      stats =
        Measurement
          .unscoped
          .with_streams(stream_id)
          .reorder(nil)
          .where(time: (end_time - 1.hour)..end_time)
          .select('AVG(value) as average, count(*) as count')
          .group(:stream_id)
          .take

      acc[:average] += stats.average.fdiv(stream_ids.length)
      acc[:count] += stats.count
      acc
    end
  end

  def number_of_contributors(stream_ids)
    Measurement
      .with_streams(stream_ids)
      .joins(:session)
      .select('DISTINCT user_id')
      .count
  end

  def end_time(stream_id)
    Measurement.with_streams(stream_id).maximum(:time)
  end
end
