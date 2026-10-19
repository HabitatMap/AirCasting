module DataFixes
  # Deletes EPA streams that have no station and were never measured: no
  # measured range, no measurements, no daily averages. Run after
  # EpaStationlessStreamsLinker and EpaUnmatchedStreamsMerger, so any stream
  # with history has been linked or merged by then.
  #
  # These were created from the old v1 site list for monitors that never
  # reported, and are gone from V2 (or sit at 0,0, which the import drops), so
  # the import does not create them again. A never-measured stream that has a
  # station is a V2 monitor and is kept.
  #
  # The delete repeats every condition in SQL, so a stream that ingest writes
  # to between the listing and the delete is kept.
  class EpaNeverMeasuredStreamsDeleter
    LOCK_TIMEOUT = '5s'.freeze

    def initialize(
      repository: GovernmentSources::Repository.new,
      logger: Logger.new($stdout)
    )
      @repository = repository
      @logger = logger
    end

    # Writes nothing unless apply: true. Returns the number of streams deleted,
    # or on a dry run the number that would be.
    def call(apply: false)
      streams =
        never_measured(repository.source_id(source_name: :epa))
          .includes(:stream_configuration)
          .order(:id)
          .to_a
      log("#{apply ? 'APPLY' : 'DRY RUN'}: #{streams.size} streams")
      streams.each do |stream|
        log(
          [
            "stream=#{stream.id}",
            "ref=#{stream.external_ref}",
            "type=#{stream.stream_configuration.measurement_type}",
            "title=#{stream.title.inspect}",
            "created_at=#{stream.created_at.iso8601}",
          ].join(' '),
        )
      end
      return streams.size unless apply && streams.any?

      deleted = delete(streams.map(&:id))
      log("Deleted #{deleted}")
      deleted
    end

    private

    attr_reader :repository, :logger

    def never_measured(source_id)
      StationStream
        .where(
          source_id: source_id,
          station_id: nil,
          first_measured_at: nil,
          last_measured_at: nil,
        )
        .where.not(
          StationMeasurement
            .where('station_measurements.station_stream_id = station_streams.id')
            .arel
            .exists,
        )
        .where.not(
          StationStreamDailyAverage
            .where(
              'station_stream_daily_averages.station_stream_id = station_streams.id',
            )
            .arel
            .exists,
        )
    end

    def delete(ids)
      StationStream.transaction do
        StationStream.connection.execute(
          "SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'",
        )
        never_measured(repository.source_id(source_name: :epa))
          .where(id: ids)
          .delete_all
      end
    end

    def log(message)
      logger.info("[EpaNeverMeasuredStreamsDeleter] #{message}")
    end
  end
end
