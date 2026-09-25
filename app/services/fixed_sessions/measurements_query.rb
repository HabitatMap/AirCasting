module FixedSessions
  # Reads measurements for exactly one stream of a fixed session.
  #
  # Fixed readings live in `fixed_measurements`, not the legacy `measurements`
  # table the mobile equivalent reads — a fixed stream has one static location
  # (the session's own latitude/longitude), so there is no per-point lat/lng to
  # return. Window and defaulting semantics otherwise match
  # MobileSessions::MeasurementsQuery exactly; see that class for the reasoning.
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
        .where(time: window)
        .reorder(time: :asc)
        .pluck(:time, :value)
        .map { |time, value| { time: to_epoch_ms(time), value: value } }
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

    # `fixed_measurements.time` holds the session's local time in a UTC column,
    # same trick as the legacy table — see FixedSessions::BinaryProtocol::Ingester
    # #build_records, which writes it with Utils.to_local_as_utc.
    def from_epoch_ms(value)
      Utils.to_local_as_utc(Time.at(value / 1000.0), session.time_zone)
    end

    def to_epoch_ms(time)
      Utils.from_local_as_utc(time, session.time_zone).to_i * 1_000
    end
  end
end
