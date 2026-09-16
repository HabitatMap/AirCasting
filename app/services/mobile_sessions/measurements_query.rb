module MobileSessions
  # Reads measurements for exactly one stream of a mobile session.
  #
  # The default answer is the *newest* data — the last 6 hours, anchored on the
  # session end — and history is reached by paging `end_time` backwards. Inside
  # the window points are ascending: plot order, so a client prepends an older
  # page whole and never reverses an array to draw a graph.
  #
  # `MobileSessionMeasurementsContract` owns the window rules and why there is no
  # point cap. Returns `nil` when the session has no such stream — the caller
  # answers 404 — and `[]` when the stream exists but the window is empty.
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
      # A session created but not yet fed measurements has no end_time_local to
      # anchor the default window on, and nothing to return either.
      return [] unless window

      points
    end

    private

    attr_reader :session, :sensor_name, :start_time, :end_time

    def stream
      return @stream if defined?(@stream)

      # Ordered, not `find_by`: the v3 create contract rejects a repeated
      # sensor_name, but legacy sessions came through SessionBuilder, which never
      # checked. Without an ORDER BY the planner picks the row, so the same
      # request could answer from a different stream between two calls.
      @stream = session.streams.where(sensor_name: sensor_name).order(:id).first
    end

    def points
      stream
        .measurements
        .where(time: window)
        .reorder(time: :asc)
        .pluck(:time, :value, :latitude, :longitude)
        .map do |time, value, latitude, longitude|
          { time: to_epoch_ms(time), value: value, latitude: latitude, longitude: longitude }
        end
    end

    def window
      return @window if defined?(@window)

      @window =
        if start_time && end_time
          from_epoch_ms(start_time)..from_epoch_ms(end_time)
        elsif session.end_time_local
          (session.end_time_local - DEFAULT_WINDOW)..session.end_time_local
        end
    end

    # `measurements.time` holds the session's local time in a UTC column, which is
    # what `start_time_local` and the ingester both write. An epoch is a real UTC
    # instant, so comparing it raw would miss the window by the session's offset.
    def from_epoch_ms(value)
      Utils.to_local_as_utc(Time.at(value / 1000.0), session.time_zone)
    end

    # The inverse, so the client reads back the same epochs it uploaded in the
    # binary frames and sends in `start_time`/`end_time`.
    def to_epoch_ms(time)
      Utils.from_local_as_utc(time, session.time_zone).to_i * 1_000
    end
  end
end
