module Eea
  module Measurements
    class Loader
      def initialize(
        repository: Eea::Repository.new,
        measurements_upserter: GovernmentSources::MeasurementsUpserter.new,
        station_stream_timestamps_updater: GovernmentSources::StationStreamTimestampsUpdater
          .new,
        cleanup_batch_worker: Eea::CleanupBatchWorker
      )
        @repository = repository
        @measurements_upserter = measurements_upserter
        @station_stream_timestamps_updater = station_stream_timestamps_updater
        @cleanup_batch_worker = cleanup_batch_worker
      end

      def call(batch_id:)
        batch = repository.find_ingest_batch!(batch_id: batch_id)
        measurements_data =
          repository.loadable_measurements_data(batch_id: batch_id)

        ActiveRecord::Base.transaction do
          measurements_upserter.call(measurements_data: measurements_data)
          station_stream_timestamps_updater.call(measurements: measurements_data)
          repository.update_ingest_batch_status!(batch: batch, status: :saved)
        end

        cleanup_batch_worker.perform_async(batch_id)
      end

      private

      attr_reader :repository,
                  :measurements_upserter,
                  :station_stream_timestamps_updater,
                  :cleanup_batch_worker
    end
  end
end
