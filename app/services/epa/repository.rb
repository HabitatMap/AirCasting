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
        update_only: %i[value epa_ingest_batch_id ingested_at],
      )
    end

    def loadable_measurements_data(batch_id:)
      sql = <<~SQL
        SELECT
          ss.id AS station_stream_id,
          tm.measured_at,
          tm.value
        FROM epa_transformed_measurements tm
        JOIN station_streams ss
          ON ss.external_ref = tm.external_ref
          AND ss.source_id = ?
        JOIN stream_configurations sc
          ON sc.id = ss.stream_configuration_id
          AND sc.measurement_type = tm.measurement_type
          AND sc.canonical = true
        WHERE tm.epa_ingest_batch_id = ?
      SQL

      ActiveRecord::Base
        .connection
        .exec_query(ActiveRecord::Base.sanitize_sql([sql, source_id, batch_id]))
        .to_a
        .map(&:symbolize_keys)
    end

    private

    def source_id
      @source_id ||= Source.find_by!(name: 'EPA').id
    end
  end
end
