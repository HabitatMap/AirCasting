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

  def is_active
    last_measurement_at > (Time.current - ACTIVE_FOR)
  end

  def generate_link(stream)
    super
  end
end
