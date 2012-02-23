class RegionInfo
  def initialize(data)
    @measurements = Measurement.
      latitude_range(data[:south], data[:north]).
      longitude_range(data[:west], data[:east])
  end

  def average
    @measurements.joins(:session).
      average(Measurement::CALIBRATE)
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

  def as_json(options=nil)
    {
      :average => average,
      :top_contributors => top_contributors,
      :number_of_contributors => number_of_contributors
    }
  end
end
