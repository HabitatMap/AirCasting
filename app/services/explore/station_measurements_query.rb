module Explore
  # Readings for exactly one stream of a public station, either source.
  #
  # Window and defaulting semantics mirror FixedSessions::MeasurementsQuery —
  # the newest data by default, the last 6 hours anchored on the station's last
  # reading, and history reached by paging `end_time` backwards. Points are
  # ascending inside the window: plot order, so a client prepends an older page
  # whole.
  #
  # Two differences from the session endpoints, both because this one is public
  # and source-agnostic:
  #
  #   * Timestamps are real UTC instants, not the station's local clock. The
  #     rest of the explore family already publishes real instants — the
  #     detail endpoint's `last_measurement.time` is one — and a client renders
  #     them with the `time_zone` that endpoint returns. So AirBeam readings are
  #     read off `fixed_measurements.time_with_time_zone` rather than the
  #     local-as-UTC `time` column the fixed-session endpoint uses.
  #   * No latitude/longitude. Both sources stand still; the station's position
  #     is on the detail endpoint and does not change per reading.
  #
  # The stream is already known to exist — Explore::StationStreamsQuery resolved
  # it — so there is no nil case here; an empty window is an empty array.
  class StationMeasurementsQuery
    DEFAULT_WINDOW = 6.hours

    def initialize(stream:, start_time: nil, end_time: nil)
      @stream = stream
      @start_time = start_time
      @end_time = end_time
    end

    def call
      return [] unless window

      points.map { |time, value| { time: time.to_i * 1_000, value: value } }
    end

    private

    attr_reader :stream, :start_time, :end_time

    def points
      if stream.airbeam?
        FixedMeasurement
          .where(stream_id: stream.id, time_with_time_zone: window)
          .reorder(time_with_time_zone: :asc)
          .pluck(:time_with_time_zone, :value)
      else
        StationMeasurement
          .where(station_stream_id: stream.id, measured_at: window)
          .reorder(measured_at: :asc)
          .pluck(:measured_at, :value)
      end
    end

    # Nil — and so an empty answer — for a stream that has never reported:
    # there is no last reading to anchor the default window on, and nothing to
    # return either.
    def window
      return @window if defined?(@window)

      @window =
        if start_time && end_time
          from_epoch_ms(start_time)..from_epoch_ms(end_time)
        elsif stream.last_measured_at
          (stream.last_measured_at - DEFAULT_WINDOW)..stream.last_measured_at
        end
    end

    def from_epoch_ms(value)
      Time.at(value / 1000.0).utc
    end
  end
end
