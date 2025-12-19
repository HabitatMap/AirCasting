module Eea
  class MeasurementsLoader
    def call(batch_id:)
      upsert_fixed_measurements_and_touch_aggregates(batch_id)
    end

    private

    def upsert_fixed_measurements_and_touch_aggregates(batch_id)
      sql = ActiveRecord::Base.send(:sanitize_sql_array, [<<~SQL, batch_id])
        WITH upserted AS (
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
          ON CONFLICT (stream_id, time_with_time_zone)
          DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at
          RETURNING
            fixed_stream_id,
            stream_id,
            measured_at
        ),
        fixed_streams_agg AS (
          SELECT
            fixed_stream_id,
            MIN(measured_at) AS first_measured_at,
            MAX(measured_at) AS last_measured_at
          FROM upserted
          GROUP BY fixed_stream_id
        ),
        updated_fixed_streams AS (
          UPDATE fixed_streams fs
          SET
            first_measured_at = CASE
              WHEN fs.first_measured_at IS NULL THEN fsa.first_measured_at
              ELSE LEAST(fs.first_measured_at, fsa.first_measured_at)
            END,
            last_measured_at = CASE
              WHEN fs.last_measured_at IS NULL THEN fsa.last_measured_at
              ELSE GREATEST(fs.last_measured_at, fsa.last_measured_at)
            END,
            updated_at = NOW()
          FROM fixed_streams_agg fsa
          WHERE fs.id = fsa.fixed_stream_id
          RETURNING
            fs.stream_id,
            fs.first_measured_at,
            fs.last_measured_at
        ),
        sessions_agg AS (
          SELECT
            se.id AS session_id,
            MAX(ufs.last_measured_at) AS last_measured_at,
            MIN(ufs.first_measured_at AT TIME ZONE COALESCE(se.time_zone, 'UTC')) AS start_time_local,
            MAX(ufs.last_measured_at  AT TIME ZONE COALESCE(se.time_zone, 'UTC')) AS end_time_local
          FROM updated_fixed_streams ufs
          JOIN streams st
            ON st.id = ufs.stream_id
          JOIN sessions se
            ON se.id = st.session_id
          GROUP BY se.id, se.time_zone
        )
        UPDATE sessions se
        SET
          last_measurement_at = sa.last_measured_at,
          start_time_local = sa.start_time_local,
          end_time_local = sa.end_time_local,
          updated_at = NOW()
        FROM sessions_agg sa
        WHERE se.id = sa.session_id;
      SQL

      ActiveRecord::Base.connection.execute(sql)
    end
  end
end
