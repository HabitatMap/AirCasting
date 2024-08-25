class FixedSession < Session
  ACTIVE_FOR = 24.hour

  validates :is_indoor, inclusion: { in: [true, false] }
  validates :latitude, :longitude, presence: true

  def self.active
    where('last_measurement_at > ?', Time.current - ACTIVE_FOR)
  end

  def self.dormant
    where('last_measurement_at <= ?', Time.current - ACTIVE_FOR)
  end

  def self.active_in_last_days(days:)
    where('last_measurement_at > ?', Time.current - days.days)
  end

  def after_measurements_created
    update_end_time!
  end

  def update_end_time!
    self.end_time_local = self.measurements.maximum('time')
    self.last_measurement_at = DateTime.current
    self.save!
  end

  def as_synchronizable(
    stream_measurements = false,
    last_measurement_sync = nil
  )
    as_json(
      methods: %i[streams],
      stream_measurements: stream_measurements,
      last_measurement_sync: last_measurement_sync,
    )
  end

  def as_json(opts = nil)
    opts ||= {}

    methods = opts[:methods] || %i[notes]
    methods << :type

    res = super(opts.merge(methods: methods))
  end

  def fixed?
    true
  end

  def generate_link(stream)
    data = {
      sensorId: stream.sensor_id,
      usernames: user.username,
      isIndoor: is_indoor,
      isActive: is_active,
      heat: {
        highest: stream.threshold_set.threshold_very_high,
        high: stream.threshold_set.threshold_high,
        mid: stream.threshold_set.threshold_medium,
        low: stream.threshold_set.threshold_low,
        lowest: stream.threshold_set.threshold_very_low,
      },
    }

    Rails.application.routes.url_helpers.fixed_map_path(
      anchor: "?selectedStreamId=#{stream.id}&data=#{data.to_json}",
    )
  end

  def is_active
    last_measurement_at > (Time.current - ACTIVE_FOR)
  end
end
