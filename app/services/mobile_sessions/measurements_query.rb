module MobileSessions
  # Reads measurements for one mobile session, keyed by sensor_name. Defaults to
  # the latest 24h so the app can do a light fetch and show recent data; an
  # explicit start_time/end_time window (epoch milliseconds, like the web
  # fixed/station measurement endpoints) pulls any older range on demand. Optional
  # sensor_name / measurement_type fetch a single stream instead of all.
  class MeasurementsQuery
    DEFAULT_WINDOW = 24.hours

    def initialize(session:, sensor_name: nil, measurement_type: nil, start_time: nil, end_time: nil)
      @session = session
      @sensor_name = sensor_name
      @measurement_type = measurement_type
      @start_time = start_time
      @end_time = end_time
    end

    def call
      selected_streams.each_with_object({}) do |stream, acc|
        acc[stream.sensor_name] = points(stream)
      end
    end

    private

    attr_reader :session, :sensor_name, :measurement_type, :start_time, :end_time

    def selected_streams
      streams = session.streams
      streams = streams.where(sensor_name: sensor_name) if sensor_name.present?
      streams = streams.where(measurement_type: measurement_type) if measurement_type.present?
      streams
    end

    def points(stream)
      stream
        .measurements
        .where(time: window)
        .order(:time)
        .pluck(:time, :value, :latitude, :longitude)
        .map { |time, value, latitude, longitude| { time: time, value: value, latitude: latitude, longitude: longitude } }
    end

    def window
      finish = end_time.present? ? epoch_ms(end_time) : session.end_time_local
      start = start_time.present? ? epoch_ms(start_time) : finish - DEFAULT_WINDOW
      start..finish
    end

    def epoch_ms(value)
      Time.at(value.to_f / 1000)
    end
  end
end
