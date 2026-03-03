module Epa
  class Repository
    def find_staging_batch!(batch_id:)
      EpaStagingBatch.find(batch_id)
    end

    def create_staging_batch!(measured_at:, epa_ingest_cycle_id:)
      EpaStagingBatch.create!(
        measured_at: measured_at,
        epa_ingest_cycle_id: epa_ingest_cycle_id,
      )
    end

    def update_staging_batch_status!(batch:, status:)
      batch.update!(status: status)
    end

    def create_ingest_cycle!(window_starts_at:, window_ends_at:)
      EpaIngestCycle.create!(window_starts_at: window_starts_at, window_ends_at: window_ends_at)
    end

    def create_load_batches_for_cycle!(cycle_id:)
      Epa::MEASUREMENT_TYPES.each do |type|
        EpaLoadBatch.create!(
          epa_ingest_cycle_id: cycle_id,
          measurement_type: type,
        )
      end
    end

    def try_start_loading(cycle_id:)
      rows = EpaIngestCycle
        .where(id: cycle_id, status: :staging)
        .where.not(
          EpaStagingBatch
            .where(epa_ingest_cycle_id: cycle_id)
            .where.not(status: %w[completed failed])
            .arel.exists,
        )
        .update_all(status: EpaIngestCycle.statuses[:loading])

      rows == 1
    end

    def try_complete_cycle(cycle_id:)
      rows = EpaIngestCycle
        .where(id: cycle_id, status: :loading)
        .where.not(
          EpaLoadBatch
            .where(epa_ingest_cycle_id: cycle_id)
            .where.not(status: :completed)
            .arel.exists,
        )
        .update_all(status: EpaIngestCycle.statuses[:completed])

      rows == 1
    end

    def find_load_batch_ids(cycle_id:)
      EpaLoadBatch.where(epa_ingest_cycle_id: cycle_id).pluck(:id)
    end

    def find_load_batch!(load_batch_id:)
      EpaLoadBatch.find(load_batch_id)
    end

    def update_load_batch_status!(load_batch:, status:)
      load_batch.update!(status: status)
    end

    def insert_raw_measurements!(records:)
      return if records.empty?

      EpaRawMeasurement.insert_all(records)
    end

    def find_raw_measurements(batch_id:)
      EpaRawMeasurement.where(epa_staging_batch_id: batch_id)
    end

    def upsert_transformed_measurements!(records:)
      return if records.empty?

      EpaTransformedMeasurement.upsert_all(
        records,
        unique_by: %i[external_ref measurement_type measured_at],
        update_only: %i[value epa_staging_batch_id ingested_at],
      )
    end

    def loadable_measurements_data(load_batch:)
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
        WHERE tm.measurement_type = ?
          AND tm.epa_staging_batch_id IN (
            SELECT id FROM epa_staging_batches WHERE epa_ingest_cycle_id = ?
          )
      SQL

      ActiveRecord::Base
        .connection
        .exec_query(
          ActiveRecord::Base.sanitize_sql([
            sql,
            source_id,
            load_batch.measurement_type,
            load_batch.epa_ingest_cycle_id,
          ]),
        )
        .to_a
        .map(&:symbolize_keys)
    end

    private

    def source_id
      @source_id ||= Source.find_by!(name: 'EPA').id
    end
  end
end
