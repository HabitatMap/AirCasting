module HourlyAverages
  class Updater
    def initialize(
      eea_repository: Eea::Repository.new,
      hourly_averages_repository: Repository.new
    )
      @eea_repository = eea_repository
      @hourly_averages_repository = hourly_averages_repository
    end

    def call(batch_id:)
      batch = eea_repository.find_ingest_batch(batch_id: batch_id)

      hourly_averages_repository.recalculate_for_time_range(
        starts_at: batch.window_starts_at,
        ends_at: batch.window_ends_at
      )
    end

    private

    attr_reader :eea_repository, :hourly_averages_repository
  end
end
