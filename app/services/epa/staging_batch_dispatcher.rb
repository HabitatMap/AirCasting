module Epa
  class StagingBatchDispatcher
    def initialize(
      repository: Repository.new,
      extract_worker: Epa::ExtractWorker
    )
      @repository = repository
      @extract_worker = extract_worker
    end

    def call(measured_at:, epa_ingest_cycle_id:)
      staging_batch = repository.create_staging_batch!(
        measured_at: measured_at,
        epa_ingest_cycle_id: epa_ingest_cycle_id,
      )

      extract_worker.perform_async(staging_batch.id)
    end

    private

    attr_reader :repository, :extract_worker
  end
end
