module Eea
  class RawMeasurementsCopier
    def initialize(
      transform_measurements_worker: Eea::TransformMeasurementsWorker
    )
      @transform_measurements_worker = transform_measurements_worker
    end

    def call(batch_id:)
      batch_path = Eea::FileStorage.parquet_glob(batch_id)

      db = DuckDB::Database.open
      con = db.connect

      sql = <<~SQL
      SELECT
        samplingpoint,
        pollutant,
        "start"   AS start_time,
        "end"     AS end_time,
        value,
        unit,
        validity,
        verification
      FROM read_parquet(
        ?,
        union_by_name = true
      )
      WHERE validity IN (1, 2, 3, 4)
    SQL

      rs = con.query(sql, batch_path)

      ActiveRecord::Base.connection.transaction do
        raw = ActiveRecord::Base.connection.raw_connection
        enco = PG::TextEncoder::CopyRow.new
        copy_sql = "COPY eea_raw_measurements (#{columns.join(',')}) FROM STDIN"
        raw.copy_data(copy_sql, enco) do
          rs.each { |row| raw.put_copy_data([batch_id] + row) }
        end
      end
      rs.close if rs.respond_to?(:close)

      transform_measurements_worker.perform_async(batch_id)
    end

    private

    attr_reader :transform_measurements_worker

    def columns
      %w[
        eea_ingest_batch_id
        samplingpoint
        pollutant
        start_time
        end_time
        value
        unit
        validity
        verification
      ]
    end
  end
end
