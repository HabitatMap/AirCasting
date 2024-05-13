module FixedStreams
  class ShowInteractor
    def initialize(
      streams_repository: StreamsRepository.new,
      measurements_repository: MeasurementsRepository.new,
      stream_daily_averages_repository: StreamDailyAveragesRepository.new,
      fixed_stream_serializer: FixedStreamSerializer.new
    )
      @streams_repository = streams_repository
      @measurements_repository = measurements_repository
      @stream_daily_averages_repository = stream_daily_averages_repository
      @fixed_stream_serializer = fixed_stream_serializer
    end

    def call(stream_id:)
      stream, measurements, stream_daily_averages, thresholds = fetch_data(stream_id)

      serialize_data =
        fixed_stream_serializer.call(
          stream: stream,
          measurements: measurements,
          stream_daily_averages: stream_daily_averages,
          thresholds: thresholds,
        )

      Success.new(serialize_data)
    end

    private

    attr_reader :streams_repository,
                :measurements_repository,
                :stream_daily_averages_repository,
                :fixed_stream_serializer

    def fetch_data(stream_id)
      stream = streams_repository.find_fixed_stream!(id: stream_id)
      measurements = measurements_repository.from_last_24_hours(stream_id: stream_id)
      stream_daily_averages = stream_daily_averages_repository.from_full_last_3_calendar_months(stream_id: stream_id)

      [stream, measurements, stream_daily_averages, thresholds]
    end
  end
end
