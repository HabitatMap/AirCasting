module Epa
  module Measurements
    class Transformer
      def initialize(
        repository: Repository.new,
        load_measurements_worker: Epa::LoadMeasurementsWorker
      )
        @repository = repository
        @load_measurements_worker = load_measurements_worker
      end

      def call(batch_id:)
        batch = repository.find_staging_batch!(batch_id: batch_id)
        records = build_transformed_records(batch_id)

        ActiveRecord::Base.transaction do
          repository.upsert_transformed_measurements!(records: records)
          repository.update_staging_batch_status!(
            batch: batch,
            status: :completed,
          )
        end

        if repository.try_start_loading(cycle_id: batch.epa_ingest_cycle_id)
          repository
            .find_load_batch_ids(cycle_id: batch.epa_ingest_cycle_id)
            .each { |id| load_measurements_worker.perform_async(id) }
        end
      end

      private

      attr_reader :repository, :load_measurements_worker

      def build_transformed_records(batch_id)
        repository
          .find_raw_measurements(batch_id: batch_id)
          .filter_map { |raw_measurement| transform_record(raw_measurement) }
      end

      def transform_record(raw_measurement)
        measured_at = normalized_timestamp(raw_measurement)
        value = normalized_value(raw_measurement.value)
        return nil unless measured_at && value

        {
          epa_staging_batch_id: raw_measurement.epa_staging_batch_id,
          external_ref: raw_measurement.aqsid,
          measurement_type:
            Epa.normalized_measurement_type(raw_measurement.parameter_name),
          measured_at: measured_at,
          value: value,
          unit_symbol: raw_measurement.reporting_units,
          ingested_at: raw_measurement.ingested_at,
        }
      end

      def normalized_timestamp(raw_measurement)
        Time.zone.strptime(
          "#{raw_measurement.valid_date} #{raw_measurement.valid_time}",
          '%m/%d/%y %H:%M',
        ) + 1.hour
      rescue ArgumentError
        nil
      end

      def normalized_value(value)
        GovernmentSources.to_float(value)
      end
    end
  end
end
