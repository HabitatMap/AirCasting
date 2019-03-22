class MobileRegionInfo
  def initialize(data)
    usernames = data[:usernames].to_s.split(/\s*,\s*/)
    @streams = Stream.
      belong_to_mobile_sessions.
      only_contributed.
      with_measurement_type(data[:measurement_type]).
      with_sensor(data[:sensor_name]).
      with_unit_symbol(data[:unit_symbol]).
      in_rectangle(data).
      with_usernames(usernames)

    stream_ids = @streams.map(&:id)
    tags = data[:tags].to_s.split(/[\s,]/)
    @measurements = Measurement.with_tags(tags).with_streams(stream_ids).in_rectangle(data).with_time(data).belonging_to_sessions_with_ids(data[:session_ids])
  end

  def average
    @measurements.average(:value)
  end

  def number_of_contributors
    @measurements.joins(:session).
      select("DISTINCT user_id").
      count
  end

  def number_of_samples
    @measurements.size
  end

  def as_json(options=nil)
    {
      :average => average,
      :number_of_contributors => number_of_contributors,
      :number_of_samples => number_of_samples
    }
  end
end
