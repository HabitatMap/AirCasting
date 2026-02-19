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
  end
end
