module Eea
  class BatchCleanup
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch(batch_id: batch_id)
      FileStorage.cleanup_batch(batch_id)

      repository.update_ingest_batch_status!(batch: batch, status: :completed)
    end

    private

    attr_reader :repository
  end
end
