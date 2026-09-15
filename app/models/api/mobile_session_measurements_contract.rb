module Api
  # Query contract for GET /api/v3/mobile_sessions/:uuid/measurements.
  #
  # `sensor_name` is always required: one stream per request, never the whole
  # session. At up to 1 Hz an AirBeam 3's five streams would multiply every
  # answer by five, and the client draws one stream at a time anyway. The web
  # fixed-session graph takes the same deal — one `stream_id` per request.
  #
  # The window is optional and comes in one piece or not at all:
  #
  #   * omitted     — the last 6 hours, anchored on the session end. The app's
  #                   default screen fetch.
  #   * start + end — epoch milliseconds, at most 12 hours wide.
  #
  # A window is bounded by time rather than by a point cap: a cap would truncate
  # silently and the client could not tell a full answer from a cut one. 12 hours
  # of 1 Hz is ~43k points — the same worst case the web graph already pulls per
  # request (30 days at 1/min). A client that wants more pages the window
  # backwards with `end_time`, the way the web graph does.
  class MobileSessionMeasurementsContract < Dry::Validation::Contract
    MAX_WINDOW_MS = 12 * 60 * 60 * 1_000

    params do
      required(:sensor_name).filled(:string)
      optional(:start_time).filled(:integer)
      optional(:end_time).filled(:integer)
    end

    # Half a window is always a client bug: the default is anchored on the
    # session end, so "from X onwards" has no meaning the server can guess.
    rule(:start_time, :end_time) do
      if values[:start_time] && values[:end_time].nil?
        key(:end_time).failure('must be sent together with start_time')
      elsif values[:end_time] && values[:start_time].nil?
        key(:start_time).failure('must be sent together with end_time')
      end
    end

    # Keyed on both, so a `start_time` the schema already rejected ("abc") skips
    # this rule instead of being compared against an Integer.
    rule(:end_time, :start_time) do
      next unless values[:start_time] && values[:end_time]

      if values[:end_time] <= values[:start_time]
        key(:end_time).failure('must be greater than start_time')
      elsif values[:end_time] - values[:start_time] > MAX_WINDOW_MS
        key(:end_time).failure(
          "window must not exceed #{MAX_WINDOW_MS} ms (12 hours); " \
          'page older data backwards with end_time',
        )
      end
    end
  end
end
