module Api
  # Query contract for GET /api/v3/fixed_sessions/:uuid/measurements.
  #
  # Mirrors MobileSessionMeasurementsContract: `sensor_name` is always required,
  # the window is optional and comes in one piece or not at all, capped at 12h.
  # See that class for the full reasoning.
  class FixedSessionMeasurementsContract < Dry::Validation::Contract
    MAX_WINDOW_MS = 12 * 60 * 60 * 1_000

    params do
      required(:sensor_name).filled(:string)
      optional(:start_time).filled(:integer)
      optional(:end_time).filled(:integer)
    end

    rule(:start_time, :end_time) do
      if values[:start_time] && values[:end_time].nil?
        key(:end_time).failure('must be sent together with start_time')
      elsif values[:end_time] && values[:start_time].nil?
        key(:start_time).failure('must be sent together with end_time')
      end
    end

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
