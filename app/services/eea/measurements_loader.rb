module Eea
  class MeasurementsLoader
    def call(batch_id:)
      upsert_fixed_measurements(batch_id)
    end

    private

    def upsert_fixed_measurements(batch_id)
      sql = ActiveRecord::Base.send(:sanitize_sql_array, [<<~SQL, batch_id])
        INSERT INTO fixed_measurements (
          stream_id,
          fixed_stream_id,
          value,
          time,
          time_with_time_zone,
          measured_at,
          created_at,
          updated_at
        )
        SELECT
          fs.stream_id AS stream_id,
          fs.id AS fixed_stream_id,
          etm.value AS value,
          (etm.measured_at AT TIME ZONE COALESCE(fs.time_zone, 'UTC')) AS time,
          etm.measured_at AS time_with_time_zone,
          etm.measured_at AS measured_at,
          NOW() AS created_at,
          NOW() AS updated_at
        FROM eea_transformed_measurements etm
        JOIN fixed_streams fs
          ON fs.external_ref = etm.external_ref
        JOIN stream_configurations sc
          ON sc.id = fs.stream_configuration_id
         AND sc.measurement_type = etm.measurement_type
         AND sc.canonical = true
        WHERE etm.eea_ingest_batch_id = ?
          AND fs.stream_id IS NOT NULL
        ON CONFLICT (fixed_stream_id, measured_at)
        DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at;
      SQL

      ActiveRecord::Base.connection.execute(sql)
    end
  end
end
