module Eea
  class MeasurementsLoader
    def initialize(
      repository: Repository.new,
      cleanup_batch_worker: Eea::CleanupBatchWorker
    )
      @repository = repository
      @cleanup_batch_worker = cleanup_batch_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch(batch_id: batch_id)

      upsert_fixed_measurements_and_touch_aggregates(batch_id)

      repository.update_ingest_batch_status!(batch: batch, status: :saved)
      cleanup_batch_worker.perform_async(batch_id)
    end

    private

    attr_reader :repository, :cleanup_batch_worker

    def upsert_fixed_measurements_and_touch_aggregates(batch_id)
      sql = ActiveRecord::Base.send(:sanitize_sql_array, [<<~SQL, batch_id])
        WITH upserted AS (
          INSERT INTO fixed_measurements (
            stream_id,
            station_stream_id,
            value,
            time,
            time_with_time_zone,
            measured_at,
            created_at,
            updated_at
          )
          SELECT
            ss.stream_id AS stream_id,
            ss.id AS station_stream_id,
            etm.value AS value,
            (etm.measured_at AT TIME ZONE COALESCE(ss.time_zone, 'UTC')) AS time,
            etm.measured_at AS time_with_time_zone,
            etm.measured_at AS measured_at,
            NOW() AS created_at,
            NOW() AS updated_at
          FROM eea_transformed_measurements etm
          JOIN station_streams ss
            ON ss.external_ref = etm.external_ref
          JOIN stream_configurations sc
            ON sc.id = ss.stream_configuration_id
           AND sc.measurement_type = etm.measurement_type
           AND sc.canonical = true
          WHERE etm.eea_ingest_batch_id = ?
            AND ss.stream_id IS NOT NULL
          ON CONFLICT (stream_id, time_with_time_zone)
          DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at
          RETURNING
            station_stream_id,
            stream_id,
            measured_at
        ),
        station_streams_agg AS (
          SELECT
            station_stream_id,
            MIN(measured_at) AS first_measured_at,
            MAX(measured_at) AS last_measured_at
          FROM upserted
          GROUP BY station_stream_id
        ),
        updated_station_streams AS (
          UPDATE station_streams ss
          SET
            first_measured_at = CASE
              WHEN ss.first_measured_at IS NULL THEN ssa.first_measured_at
              ELSE LEAST(ss.first_measured_at, ssa.first_measured_at)
            END,
            last_measured_at = CASE
              WHEN ss.last_measured_at IS NULL THEN ssa.last_measured_at
              ELSE GREATEST(ss.last_measured_at, ssa.last_measured_at)
            END,
            updated_at = NOW()
          FROM station_streams_agg ssa
          WHERE ss.id = ssa.station_stream_id
          RETURNING
            ss.stream_id,
            ss.first_measured_at,
            ss.last_measured_at
        ),
        sessions_agg AS (
          SELECT
            se.id AS session_id,
            MAX(uss.last_measured_at) AS last_measured_at,
            MIN(uss.first_measured_at AT TIME ZONE COALESCE(se.time_zone, 'UTC')) AS start_time_local,
            MAX(uss.last_measured_at  AT TIME ZONE COALESCE(se.time_zone, 'UTC')) AS end_time_local
          FROM updated_station_streams uss
          JOIN streams st
            ON st.id = uss.stream_id
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
