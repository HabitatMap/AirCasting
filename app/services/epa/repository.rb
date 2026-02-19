module Epa
  class Repository
    def find_ingest_batch!(batch_id:)
      EpaIngestBatch.find(batch_id)
    end

    def create_ingest_batch!(measured_at:)
      EpaIngestBatch.create!(measured_at: measured_at)
    end

    def update_ingest_batch_status!(batch:, status:)
      batch.update!(status: status)
    end

    def insert_raw_measurements!(records:)
      return if records.empty?

      EpaRawMeasurement.insert_all(records)
    end

    def find_raw_measurements(batch_id:)
      EpaRawMeasurement.where(epa_ingest_batch_id: batch_id)
    end

    def upsert_transformed_measurements!(records:)
      return if records.empty?

      EpaTransformedMeasurement.upsert_all(
        records,
        unique_by: %i[external_ref measurement_type measured_at],
        update_only: %i[value epa_ingest_batch_id ingested_at]
      )
    end
  end
end
