class MobileRegionInfo
  def initialize(data)
    usernames = data[:usernames].to_s.split(/\s*,\s*/)
    stream_ids = data[:stream_ids].split(",")
    @streams = Stream.where(id: stream_ids)
    tags = data[:tags].to_s.split(/[\s,]/)
    @measurements =
      Measurement
        .with_tags(tags)
        .with_streams(stream_ids)
        .in_rectangle(data)
        .with_time(data)
  end

  def average
    @measurements.average(:value)
  end

  def number_of_contributors
    @measurements.joins(:session).select('DISTINCT user_id').count
  end

  def number_of_samples
    @measurements.size
  end

  def as_json(options = nil)
    {
      average: average,
      number_of_contributors: number_of_contributors,
      number_of_samples: number_of_samples
    }
  end
end
