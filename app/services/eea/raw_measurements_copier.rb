module Eea
  class RawMeasurementsCopier
    ROOT_DIR = Rails.root.join('storage', 'eea', 'incoming').to_s

    def call(batch_id:)
      batch_path = File.join(ROOT_DIR, batch_id.to_s, 'E2a', '*.parquet')

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
    end

    private

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
