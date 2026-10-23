module StationStreams
  class ShowInteractor
    def initialize(
      repository: StationStreamsRepository.new,
      measurements_repository: StationMeasurementsRepository.new,
      stream_daily_averages_repository: StationStreamDailyAveragesRepository.new,
      serializer: StationStreamShowSerializer.new
    )
      @repository = repository
      @measurements_repository = measurements_repository
      @stream_daily_averages_repository = stream_daily_averages_repository
      @serializer = serializer
    end

    def call(station_stream_id:)
      station_stream = repository.find(station_stream_id)
      # A stream that never reported has nothing to show. The payload is the
      # envelope's own shape so the controller can hand it to `render_failure`
      # — it used to be `{ id: ['not found'] }`, which nothing ever read.
      unless station_stream&.last_measured_at
        return Failure.new(
          error_code: Api::ErrorCodes::NOT_FOUND,
          message: 'Station stream not found',
        )
      end

      measurements =
        measurements_repository.last_2_days(
          station_stream_id: station_stream_id,
        )
      stream_daily_averages =
        stream_daily_averages_repository.from_full_last_3_calendar_months(
          station_stream_id: station_stream_id,
        )

      Success.new(
        serializer.call(
          station_stream: station_stream,
          measurements: measurements,
          stream_daily_averages: stream_daily_averages,
        ),
      )
    end

    private

    attr_reader :repository,
                :measurements_repository,
                :stream_daily_averages_repository,
                :serializer
  end
end
