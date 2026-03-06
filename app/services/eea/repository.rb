module Eea
  class Repository
    def find_ingest_batch!(batch_id:)
      EeaIngestBatch.find(batch_id)
    end

    def create_ingest_batch!(
      country:,
      pollutant:,
      window_starts_at:,
      window_ends_at:
    )
      EeaIngestBatch.create!(
        country: country,
        pollutant: pollutant,
        window_starts_at: window_starts_at,
        window_ends_at: window_ends_at,
      )
    end

    def update_ingest_batch_status!(batch:, status:)
      batch.update!(status: status)
    end

    def purge_transformed_measurements!(cutoff:)
      sql =
        ActiveRecord::Base.send(
          :sanitize_sql_array,
          [
            'DELETE FROM eea_transformed_measurements WHERE ingested_at < ?',
            cutoff,
          ],
        )

      ActiveRecord::Base.connection.execute(sql)
    end

    def purge_raw_measurements!(cutoff:)
      sql =
        ActiveRecord::Base.send(
          :sanitize_sql_array,
          [
            'DELETE FROM eea_raw_measurements WHERE ingested_at < ?',
            cutoff,
          ],
        )

      ActiveRecord::Base.connection.execute(sql)
    end

    def loadable_measurements_data(batch_id:)
      sql = <<~SQL
        SELECT
          ss.id AS station_stream_id,
          tm.measured_at,
          tm.value
        FROM eea_transformed_measurements tm
        JOIN station_streams ss
          ON ss.external_ref = tm.external_ref
          AND ss.source_id = ?
        JOIN stream_configurations sc
          ON sc.id = ss.stream_configuration_id
          AND sc.measurement_type = tm.measurement_type
          AND sc.canonical = true
        WHERE tm.eea_ingest_batch_id = ?
      SQL

      ActiveRecord::Base
        .connection
        .exec_query(ActiveRecord::Base.sanitize_sql([sql, source_id, batch_id]))
        .to_a
        .map(&:symbolize_keys)
    end

    private

    def source_id
      @source_id ||= Source.find_by!(name: 'EEA').id
    end
  end
end
