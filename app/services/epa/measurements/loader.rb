module Epa
  module Measurements
    class Loader
      def initialize(
        repository: Epa::Repository.new,
        measurements_upserter: GovernmentSources::MeasurementsUpserter.new,
        station_stream_timestamps_updater: GovernmentSources::StationStreamTimestampsUpdater
          .new
      )
        @repository = repository
        @measurements_upserter = measurements_upserter
        @station_stream_timestamps_updater = station_stream_timestamps_updater
      end

      def call(load_batch_id:)
        load_batch = repository.find_load_batch!(load_batch_id: load_batch_id)
        measurements_data =
          repository.loadable_measurements_data(load_batch: load_batch)

        ActiveRecord::Base.transaction do
          measurements_upserter.call(measurements_data: measurements_data)
          station_stream_timestamps_updater.call(
            measurements: measurements_data,
          )

          repository.update_load_batch_status!(
            load_batch: load_batch,
            status: :completed,
          )
        end

        repository.try_complete_cycle(cycle_id: load_batch.epa_ingest_cycle_id)
      end

      private

      attr_reader :repository,
                  :measurements_upserter,
                  :station_stream_timestamps_updater
    end
  end
end
