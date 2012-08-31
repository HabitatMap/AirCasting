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
    sensors = Stream.all.map(&:sensor_name).uniq

    results = {}

    sensors.each do |sensor|
      results[sensor] = @measurements.joins(:user).
        joins(:stream).
        where(:'streams.sensor_name' => sensor).
        group(:user_id).
        order("count(*) DESC").
        limit(10).
        select(:username).
        map(&:username)
    end

    results
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
      :top_contributors_per_sensor => top_contributors_per_sensor,
      :number_of_contributors => number_of_contributors,
      :number_of_samples => number_of_samples,
      :number_of_contributors_per_sensor => number_of_contributors_per_sensor,
      :number_of_samples_per_sensor => number_of_samples_per_sensor
    }
  end
end
