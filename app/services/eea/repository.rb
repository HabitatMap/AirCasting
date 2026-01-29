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

    def eea_user
      User.find_by!(username: 'EEA')
    end

    def air_now_threshold_sets
      ThresholdSet.where(
        sensor_name: %w[Government-PM2.5 Government-NO2 Government-Ozone],
      )
    end

    def insert_sessions!(session_params:)
      result = Session.insert_all!(session_params, returning: %w[id])

      result.rows.flatten
    end

    def insert_streams!(stream_params:)
      result = Stream.insert_all!(stream_params, returning: %w[id])

      result.rows.flatten
    end

    def insert_fixed_streams!(fixed_streams_params:)
      FixedStream.upsert_all(
        fixed_streams_params,
        unique_by: %i[source_id stream_configuration_id external_ref],
      )
    end

    def delete_raw_measurements!(batch_id:)
      sql =
        ActiveRecord::Base.send(
          :sanitize_sql_array,
          [
            'DELETE FROM eea_raw_measurements WHERE eea_ingest_batch_id = ?',
            batch_id,
          ],
        )

      ActiveRecord::Base.connection.execute(sql)
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
