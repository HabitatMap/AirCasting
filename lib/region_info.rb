class RegionInfo
  def initialize(data)
    @streams = Stream.where(:sensor_name => data[:sensor_name])
    @stream_ids = @streams.map(&:id)

    @measurements = Measurement.
      where(:stream_id => @stream_ids).
      latitude_range(data[:south], data[:north]).
      longitude_range(data[:west], data[:east])
  end

  def average
    @measurements.average(:value)
  end

  def top_contributors
    @measurements.joins(:user).
      group(:user_id).
      order("count(*) DESC").
      limit(10).
      select(:username).
      map(&:username)
  end

  def number_of_contributors
    @measurements.joins(:user).
      select("DISTINCT user_id").
      count
  end

  def number_of_samples
    @measurements.size
  end

  def as_json(options=nil)
    {
      :average => average,
      :top_contributors => top_contributors,
      :number_of_contributors => number_of_contributors,
      :number_of_samples => number_of_samples
    }
  end
end
