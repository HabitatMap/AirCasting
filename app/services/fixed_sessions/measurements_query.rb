module FixedSessions
  # Reads measurements for exactly one stream of a fixed session.
  #
  # Fixed readings live in `fixed_measurements`, not the legacy `measurements`
  # table the mobile equivalent reads — a fixed stream has one static location
  # (the session's own latitude/longitude), so there is no per-point lat/lng to
  # return. Window and defaulting semantics otherwise match
  # MobileSessions::MeasurementsQuery exactly; see that class for the reasoning.
  #
  # Both the window and the answer are real UTC instants, read straight off
  # `time_with_time_zone`. The mobile equivalent cannot do this — the legacy
  # `measurements` table has the column but leaves it nullable and indexes only
  # `(stream_id, time)` — so it works in the session's local clock and converts
  # on both edges. Here the timestamptz is NOT NULL and carries the only
  # composite index there is, `(stream_id, time_with_time_zone)`, so reading the
  # local-as-UTC `time` column instead would mean filtering every row of the
  # stream rather than scanning the window, and would collapse the two readings
  # an hour apart in a DST fall-back onto one epoch.
  class MeasurementsQuery
    DEFAULT_WINDOW = 6.hours

    def initialize(session:, sensor_name:, start_time: nil, end_time: nil)
      @session = session
      @sensor_name = sensor_name
      @start_time = start_time
      @end_time = end_time
    end

    def call
      return nil unless stream
      return [] unless window

      points
    end

    private

    attr_reader :session, :sensor_name, :start_time, :end_time

    def stream
      return @stream if defined?(@stream)

      @stream = session.streams.where(sensor_name: sensor_name).order(:id).first
    end

    def points
      stream
        .fixed_measurements
        .where(time_with_time_zone: window)
        .reorder(time_with_time_zone: :asc)
        .pluck(:time_with_time_zone, :value)
        .map { |time, value| { time: to_epoch_ms(time), value: value } }
    end

    def window
      return @window if defined?(@window)

      @window =
        if start_time && end_time
          from_epoch_ms(start_time)..from_epoch_ms(end_time)
        elsif anchor
          (anchor - DEFAULT_WINDOW)..anchor
        end
    end

    # `sessions.end_time_local` is the one value still in the session's local
    # clock — sessions have no timestamptz column to anchor on — so the default
    # window's anchor is converted once, here, rather than every row being
    # converted on the way out.
    def anchor
      return @anchor if defined?(@anchor)

      @anchor =
        session.end_time_local &&
        Utils.from_local_as_utc(session.end_time_local, session.time_zone)
    end

    def from_epoch_ms(value)
      Time.at(value / 1000.0).utc
    end

    def to_epoch_ms(time)
      time.to_i * 1_000
    end
  end
end
