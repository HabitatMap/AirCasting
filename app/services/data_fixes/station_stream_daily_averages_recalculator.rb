module DataFixes
  class StationStreamDailyAveragesRecalculator
    BATCH_SIZE = 200

    def initialize(
      repository: GovernmentSources::Repository.new,
      logger: Logger.new('log/station_stream_daily_averages_recalculation.log')
    )
      @repository = repository
      @logger = logger
    end

    def call(source_name:, since: Time.utc(2000, 1, 1))
      source_id = Source.find_by!(name: source_name.to_s.upcase).id
      scope = StationStream.where(source_id: source_id)

      log(source_name, "Source ID: #{source_id}")
      log(source_name, "Station streams to process: #{scope.count}")

      processed = 0
      errors = []

      scope.find_in_batches(batch_size: BATCH_SIZE) do |batch|
        batch.group_by(&:time_zone).each do |time_zone, streams|
          repository.upsert_station_stream_daily_averages(
            stream_ids: streams.map(&:id),
            time_zone: time_zone,
            since: since,
          )
        end

        processed += batch.size
        log(source_name, "Progress: processed=#{processed}, errors=#{errors.count}")
      rescue StandardError => e
        log(source_name, "ERROR in batch: #{e.message}")
        errors << { batch_stream_ids: batch.map(&:id), error: e.message }
      end

      log(source_name, "Done: processed=#{processed}, errors=#{errors.count}")
      { processed: processed, errors: errors }
    end

    private

    attr_reader :repository, :logger

    def log(source_name, message)
      logger.info("[StationStreamDailyAveragesRecalculator/#{source_name.to_s.upcase}] #{message}")
    end
  end
end
