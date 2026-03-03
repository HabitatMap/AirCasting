module Epa
  class IngestOrchestrator
    HOURS_TO_PROCESS = 24

    def initialize(
      repository: Repository.new,
      staging_batch_dispatcher: StagingBatchDispatcher.new
    )
      @repository = repository
      @staging_batch_dispatcher = staging_batch_dispatcher
    end

    def call
      cycle =
        repository.create_ingest_cycle!(
          window_starts_at: window_starts_at,
          window_ends_at: window_ends_at,
        )

      repository.create_load_batches_for_cycle!(cycle_id: cycle.id)

      dispatch_staging_batches(cycle)
    end

    private

    attr_reader :repository, :staging_batch_dispatcher

    def window_ends_at
      @window_ends_at ||= Time.current.beginning_of_hour - 1.hour
    end

    def window_starts_at
      window_ends_at - (HOURS_TO_PROCESS - 1).hours
    end

    def dispatch_staging_batches(cycle)
      HOURS_TO_PROCESS.times do |offset|
        staging_batch_dispatcher.call(
          measured_at: cycle.window_starts_at + offset.hours,
          epa_ingest_cycle_id: cycle.id,
        )
      end
    end
  end
end
