module Eea
  class Repository
    def find_ingest_batch(batch_id:)
      EeaIngestBatch.find(batch_id)
    end

    def find_or_create_ingest_batch_by!(
      country:,
      pollutant:,
      window_starts_at:,
      window_ends_at:
    )
      EeaIngestBatch.find_or_create_by!(
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
  end
end
