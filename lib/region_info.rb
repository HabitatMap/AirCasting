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

  def top_contributors_per_sensor
 #TODO
  end

  def number_of_contributors
    @measurements.joins(:user).
      select("DISTINCT user_id").
      count
  end

  def number_of_contributors_per_sensor
    @measurements.joins(:user).
      select("DISTINCT user_id").
      group(:sensor_name).
      count
  end

  def number_of_samples
    @measurements.size
  end

  def number_of_samples_per_sensor
    @measurements.joins(:stream).
      group(:sensor_name).
      count
  end

  def as_json(options=nil)
    {
      :average => average,
      :averages => averages,
      :top_contributors => top_contributors,
      :number_of_contributors => number_of_contributors,
      :number_of_samples => number_of_samples,
      :number_of_contributors_per_sensor => number_of_contributors_per_sensor,
      :number_of_samples_per_sensor => number_of_samples_per_sensor
    }
  end
end
