module AirNowStreaming
  class StreamsCreator
    def initialize(
      repository: Repository.new,
      streams_default_values_fetcher: StreamsDefaultValuesFetcher.new
    )
      @repository = repository
      @streams_default_values_fetcher = streams_default_values_fetcher
    end

    def call(sessions_data:)
      sessions, streams, fixed_measurements = [], [], []

      sessions_data.each do |session_data, measurements|
        first_measurement = measurements.min_by { |m| m[:time] }
        last_measurement = measurements.max_by { |m| m[:time] }
        session =
          build_session(session_data, first_measurement, last_measurement)
        sessions << session
        stream = build_stream(session_data, session)
        streams << stream
        fixed_measurements << build_fixed_measurements(measurements, stream)
      end

      import(sessions, streams, fixed_measurements)
    end

    private

    attr_reader :repository, :streams_default_values_fetcher

    def build_session(session_data, first_measurement, last_measurement)
      uuid = SecureRandom.uuid

      Session.new(
        latitude: session_data[:latitude],
        longitude: session_data[:longitude],
        time_zone: last_measurement[:time_zone],
        title: last_measurement[:title],
        user: air_now_user,
        uuid: uuid,
        url_token: uuid,
        contribute: true,
        start_time_local: first_measurement[:time],
        end_time_local: last_measurement[:time],
        last_measurement_at: last_measurement[:time_with_time_zone],
        type: 'FixedSession',
        is_indoor: false,
      )
    end

    def build_stream(session_data, session)
      d = streams_default_values[session_data[:sensor_name]]

      Stream.new(
        session: session,
        threshold_set_id: d[:threshold_set_id],
        sensor_name: d[:sensor_name],
        unit_name: d[:unit_name],
        measurement_type: d[:measurement_type],
        measurement_short_type: d[:measurement_short_type],
        unit_symbol: d[:unit_symbol],
        sensor_package_name: d[:sensor_package_name],
        min_latitude: session_data[:latitude],
        max_latitude: session_data[:latitude],
        min_longitude: session_data[:longitude],
        max_longitude: session_data[:longitude],
        start_latitude: session_data[:latitude],
        start_longitude: session_data[:longitude],
      )
    end

    def build_fixed_measurements(measurements, stream)
      measurements.map do |measurement_data|
        FixedMeasurement.new(
          value: measurement_data[:value],
          time: measurement_data[:time],
          time_with_time_zone: measurement_data[:time_with_time_zone],
          stream: stream,
        )
      end
    end

    def air_now_user
      @air_now_user ||= repository.air_now_user
    end

    def streams_default_values
      @streams_default_values ||= streams_default_values_fetcher.call
    end

    def import(sessions, streams, fixed_measurements)
      repository.import_sessions(sessions: sessions)
      repository.import_streams(streams: streams)
      repository.import_fixed_measurements(
        fixed_measurements: fixed_measurements.flatten,
      )
    end
  end
end
