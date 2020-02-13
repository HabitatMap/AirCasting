class FixedSession < Session
  ACTIVE_FOR = 4.hour

  validates :is_indoor, inclusion: { in: [true, false] }
  validates :latitude, :longitude, presence: true

  def self.active
    where('last_measurement_at > ?', Time.current - ACTIVE_FOR)
  end

  def self.dormant
    where('last_measurement_at <= ?', Time.current - ACTIVE_FOR)
  end

  def self.all_active(data)
    active.with_user_and_streams.filter_(data)
  end

  def self.all_dormant(data, limit, offset)
    dormant.offset(offset).limit(limit).with_user_and_streams.filter_(data)
  end

  def after_measurements_created
    update_end_time!
  end

  def update_end_time!
    # Measurement.time is a local time, so this are both local end times:
    self.end_time = self.measurements.maximum('time')
    self.end_time_local = self.measurements.maximum('time')
    self.last_measurement_at = DateTime.current
    self.save!
  end

  def last_hour_average
    stream = self.streams.length >= 1 ? self.streams.first : nil
    return unless stream
    stream.last_hour_average
  end

  def as_synchronizable(
    stream_measurements = false, last_measurement_sync = nil
  )
    as_json(
      methods: %i[streams],
      stream_measurements: stream_measurements,
      last_measurement_sync: last_measurement_sync
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
        highest: stream.threshold_very_high,
        high: stream.threshold_high,
        mid: stream.threshold_medium,
        low: stream.threshold_low,
        lowest: stream.threshold_very_low
      }
    }

    Rails.application.routes.url_helpers.fixed_map_path(
      anchor: "?selectedSessionIds=#{[id].to_json}&data=#{data.to_json}"
    )
  end

  private

  def is_active
    last_measurement_at > (Time.current - ACTIVE_FOR)
  end
end
