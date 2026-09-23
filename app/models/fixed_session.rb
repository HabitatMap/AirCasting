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

  # Comparing a nil last_measurement_at raised, so one un-fed session anywhere in
  # a map response was a 500 rather than a wrong flag. Thousands of rows have no
  # value: the column was added without a backfill, EPA station rows keep their
  # measurements in station_measurements, and a v3 session exists before its
  # first reading lands. created_at is the fallback, so a session with no
  # measurements yet reads active and an abandoned one reads dormant.
  #
  # The `active`/`dormant` scopes deliberately still drop those rows — they are
  # consumed by legacy endpoints, and widening them is a separate decision.
  def is_active
    (last_measurement_at || created_at) > (Time.current - ACTIVE_FOR)
  end

  def generate_link(stream)
    super
  end
end
