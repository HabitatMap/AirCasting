module HourlyAverages
  class Updater
    def initialize(
      eea_repository: Eea::Repository.new,
      hourly_averages_repository: Repository.new,
      cleanup_batch_worker: Eea::CleanupBatchWorker
    )
      @eea_repository = eea_repository
      @hourly_averages_repository = hourly_averages_repository
      @cleanup_batch_worker = cleanup_batch_worker
    end

    def call(batch_id:)
      batch = eea_repository.find_ingest_batch(batch_id: batch_id)

      hourly_averages_repository.recalculate_for_time_range(
        starts_at: batch.window_starts_at,
        ends_at: batch.window_ends_at,
      )

      eea_repository.update_ingest_batch_status!(
        batch: batch,
        status: :averaged,
      )

      eea_repository.update_ingest_batch_status!(batch: batch, status: :averaged)
      cleanup_batch_worker.perform_async(batch_id)
    end

    private

    attr_reader :eea_repository, :hourly_averages_repository, :cleanup_batch_worker
  end
end
