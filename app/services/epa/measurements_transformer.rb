module Epa
  class MeasurementsTransformer
    def initialize(
      repository: Repository.new,
      load_measurements_worker: Epa::LoadMeasurementsWorker
    )
      @repository = repository
      @load_measurements_worker = load_measurements_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch!(batch_id: batch_id)
      records = build_transformed_records(batch_id)

      ActiveRecord::Base.transaction do
        repository.upsert_transformed_measurements!(records: records)
        repository.update_ingest_batch_status!(
          batch: batch,
          status: :transformed,
        )
      end

      load_measurements_worker.perform_async(batch_id)
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
        epa_ingest_batch_id: raw_measurement.epa_ingest_batch_id,
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
