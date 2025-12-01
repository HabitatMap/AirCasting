module Eea
  class IngestBatchEnqueuer
    def initialize(
      repository: Repository.new,
      download_zip_worker: Eea::DownloadZipWorker
    )
      @repository = repository
      @download_zip_worker = download_zip_worker
    end

    def call(country:, pollutant:, window_starts_at:, window_ends_at:)
      ingest_batch =
        repository.find_or_create_ingest_batch_by!(
          country: country,
          pollutant: pollutant,
          window_starts_at: window_starts_at,
          window_ends_at: window_ends_at,
        )

      return if ingest_batch.processing?

      download_zip_worker.perform_async(ingest_batch.id)
    end

    private

    attr_reader :repository, :download_zip_worker
  end
end
