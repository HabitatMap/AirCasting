module Eea
  class MeasurementsTransformer
    def initialize(
      repository: Repository.new,
      load_measurements_worker: Eea::LoadMeasurementsWorker
    )
      @repository = repository
      @load_measurements_worker = load_measurements_worker
    end

    def call(batch_id:)
      batch = repository.find_ingest_batch(batch_id: batch_id)

      sql = ActiveRecord::Base.send(:sanitize_sql_array, [<<~SQL, batch_id])
      INSERT INTO eea_transformed_measurements (
        eea_ingest_batch_id,
        external_ref,
        measurement_type,
        measured_at,
        value,
        unit_symbol,
        ingested_at,
        created_at,
        updated_at
      )
      SELECT
        r.eea_ingest_batch_id,
        CASE
          WHEN r.samplingpoint LIKE '%/%'
            THEN split_part(r.samplingpoint, '/', 2)
          ELSE r.samplingpoint
        END AS external_ref,
        CASE r.pollutant
          WHEN 7    THEN 'Ozone'
          WHEN 6001 THEN 'PM2.5'
          WHEN 8    THEN 'NO2'
        END AS measurement_type,
        r.end_time AT TIME ZONE 'Etc/GMT-1' AS measured_at,
        CASE r.pollutant
          WHEN 7 THEN r.value / 1.96
          WHEN 8 THEN r.value / 1.88
          ELSE r.value
        END AS value,
        r.unit AS unit_symbol,
        r.ingested_at AS ingested_at,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM eea_raw_measurements r
      WHERE r.eea_ingest_batch_id = ?
        AND r.pollutant IN (7, 6001, 8)

      ON CONFLICT (external_ref, measurement_type, measured_at)
      DO UPDATE
      SET
        value = EXCLUDED.value,
        eea_ingest_batch_id = EXCLUDED.eea_ingest_batch_id,
        ingested_at = EXCLUDED.ingested_at,
        updated_at = NOW()
      WHERE EXCLUDED.ingested_at > eea_transformed_measurements.ingested_at;
    SQL

      ActiveRecord::Base.connection.execute(sql)

      repository.update_ingest_batch_status!(batch: batch, status: :transformed)
      load_measurements_worker.perform_async(batch_id)
    end

    private

    attr_reader :repository, :load_measurements_worker
  end
end
