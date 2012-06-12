class RegionInfo
  def initialize(data)
    @measurements = Measurement.
      latitude_range(data[:south], data[:north]).
      longitude_range(data[:west], data[:east])
  end

  def average
    @measurements.joins(:session).
      average(:value)
  end

  def averages
    @measurements.joins(:session).
      group(:sensor_name).
      average(:value)
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
      :averages => averages,
      :top_contributors => top_contributors,
      :number_of_contributors => number_of_contributors,
      :number_of_samples => number_of_samples
    }
  end
end
