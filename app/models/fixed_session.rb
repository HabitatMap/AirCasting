class FixedSession < Session
  ACTIVE_FOR = 24.hour

  validates :is_indoor, inclusion: { in: [true, false] }
  validates :latitude, :longitude, presence: true

  # Declared intent outranks observed silence: a finished session is dormant
  # however recently it reported. Without the second clause a monitor finished
  # today stays on the active map for up to 24h — and, once `is_active` below
  # reads `finished_at` too, lands there flagged inactive.
  def self.active
    where(finished_at: nil).where(
      'last_measurement_at > ?',
      Time.current - ACTIVE_FOR,
    )
  end

  # The complement, so finishing moves a session between the two lists instead of
  # dropping it out of both. A never-fed row is still in neither unless it was
  # finished — NULL fails every comparison, legacy behaviour these scopes keep
  # while `is_active` does not; see there.
  def self.dormant
    where(
      'finished_at IS NOT NULL OR last_measurement_at <= ?',
      Time.current - ACTIVE_FOR,
    )
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
  #
  # `finished_at` short-circuits the whole thing: the owner said the monitor is
  # done, which no amount of recent traffic overrides. It is also the one case
  # where silence is not the signal — a finished session can still be accepting a
  # pre-finish backlog, which moves `last_measurement_at` to now.
  def is_active
    return false if finished_at

    (last_measurement_at || created_at) > (Time.current - ACTIVE_FOR)
  end

  def generate_link(stream)
    super
  end
end
