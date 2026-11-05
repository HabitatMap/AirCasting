module Explore
  # Readings for exactly one stream of a public station, either source.
  #
  # Window and defaulting semantics mirror FixedSessions::MeasurementsQuery —
  # the newest data by default, the last 6 hours anchored on the station's last
  # reading, and history reached by paging `end_time` backwards. Points are
  # ascending inside the window: plot order, so a client prepends an older page
  # whole.
  #
  # Epochs are real UTC instants, on the wire and in the window, same as the
  # session endpoints. They get there differently: FixedSessions::MeasurementsQuery
  # reads the local-as-UTC `time` column and converts both ways with
  # Utils.to_local_as_utc / from_local_as_utc, while this one reads
  # `fixed_measurements.time_with_time_zone`, which is already a real instant.
  # Same answer for the same row — the ingester writes both columns from one
  # timestamp — except in the hour that repeats on a DST fall-back, where the
  # conversion has to pick one of the two instants a wall clock could mean and
  # this path never has to. Utils.from_local_as_utc says as much.
  #
  # The one shape difference from the session endpoints is latitude/longitude,
  # absent here: both sources stand still, so the position is on the station
  # detail rather than repeated on every reading.
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
