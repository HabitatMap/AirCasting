module FixedStreams
  class ShowInteractor
    def initialize(
      streams_repository: StreamsRepository.new,
      fixed_measurements_repository: FixedMeasurementsRepository.new,
      stream_daily_averages_repository: StreamDailyAveragesRepository.new,
      fixed_stream_serializer: FixedStreamSerializer.new
    )
      @streams_repository = streams_repository
      @fixed_measurements_repository = fixed_measurements_repository
      @stream_daily_averages_repository = stream_daily_averages_repository
      @fixed_stream_serializer = fixed_stream_serializer
    end

    def call(stream_id:)
      # `find_by_id`, not `find`: an id naming no stream — or not an integer at
      # all — is a 404 the client can read, not an `ActiveRecord::RecordNotFound`
      # rendered by Rails in a shape nothing else on `/api/v3` uses.
      stream = streams_repository.find_by_id(stream_id)
      unless stream
        return Failure.new(
          error_code: Api::ErrorCodes::NOT_FOUND,
          message: 'Fixed stream not found',
        )
      end

      measurements, stream_daily_averages = fetch_data(stream_id)

      serialize_data =
        fixed_stream_serializer.call(
          stream: stream,
          measurements: measurements,
          stream_daily_averages: stream_daily_averages,
        )

      Success.new(serialize_data)
    end

    private

    attr_reader :streams_repository,
                :fixed_measurements_repository,
                :stream_daily_averages_repository,
                :fixed_stream_serializer

    def fetch_data(stream_id)
      fixed_measurements =
        fixed_measurements_repository.last_2_days(stream_id: stream_id)
      stream_daily_averages =
        stream_daily_averages_repository.from_full_last_3_calendar_months(
          stream_id: stream_id,
        )

      [fixed_measurements, stream_daily_averages]
    end
  end
end
