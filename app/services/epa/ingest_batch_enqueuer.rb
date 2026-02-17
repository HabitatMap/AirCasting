module Epa
  class IngestBatchEnqueuer
    def initialize(
      repository: Repository.new,
      extract_worker: Epa::ExtractWorker
    )
      @repository = repository
      @extract_worker = extract_worker
    end

    def call(measured_at:)
      ingest_batch = repository.create_ingest_batch!(measured_at: measured_at)

      extract_worker.perform_async(ingest_batch.id)
    end

    private

    attr_reader :repository, :extract_worker
  end
end
