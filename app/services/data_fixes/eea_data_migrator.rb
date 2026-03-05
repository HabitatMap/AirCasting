module DataFixes
  class EeaDataMigrator
    def initialize(logger: Logger.new('log/eea_migration.log'))
      @logger = logger
    end

    def call
      source_id = fetch_source_id
      already_migrated_keys = fetch_already_migrated_keys(source_id)
      all_fixed_streams = fixed_streams_to_migrate(source_id)

      log("Source ID: #{source_id}")
      log("Already migrated: #{already_migrated_keys.size}")
      log("Fixed streams to migrate: #{all_fixed_streams.count}")

      migrated = 0
      skipped = 0
      measurements_copied = 0
      errors = []

      all_fixed_streams.find_in_batches(batch_size: 500) do |batch|
        to_process =
          batch.reject do |fs|
            already_migrated_keys.include?(
              [fs.stream_configuration_id, fs.external_ref],
            )
          end
        skipped += batch.size - to_process.size

        next if to_process.empty?

        begin
          ActiveRecord::Base.transaction do
            attrs = to_process.map { |fs| build_station_stream_attrs(fs) }

            inserted =
              StationStream.insert_all(
                attrs,
                returning: %w[id stream_configuration_id external_ref],
              )

            fs_by_key =
              to_process.index_by do |fs|
                [fs.stream_configuration_id, fs.external_ref]
              end

            stream_mappings =
              inserted.rows.filter_map do |ss_id, sc_id, ext_ref|
                fs = fs_by_key[[sc_id.to_i, ext_ref]]
                [ss_id, fs.id] if fs
              end

            measurements_copied += copy_measurements_batch(stream_mappings)
            migrated += stream_mappings.size

            stream_mappings.each do |_ss_id, fs_id|
              fs = to_process.find { |s| s.id == fs_id }
              log("Migrated fixed_stream #{fs_id} (#{fs&.title})")
            end
          end
        rescue StandardError => e
          log("ERROR in batch: #{e.message}")
          errors << { error: e.message }
        end

        log(
          "Progress: migrated=#{migrated}, skipped=#{skipped}, measurements_copied=#{measurements_copied}, errors=#{errors.count}",
        )
      end

      {
        migrated: migrated,
        skipped: skipped,
        measurements_copied: measurements_copied,
        errors: errors,
      }
    end

    private

    attr_reader :logger

    def fetch_source_id
      Source.find_by!(name: 'EEA').id
    end

    def fetch_already_migrated_keys(source_id)
      StationStream
        .where(source_id: source_id)
        .pluck(:stream_configuration_id, :external_ref)
        .to_set
    end

    def fixed_streams_to_migrate(source_id)
      FixedStream.where(source_id: source_id)
    end

    def build_station_stream_attrs(fixed_stream)
      {
        source_id: fixed_stream.source_id,
        stream_configuration_id: fixed_stream.stream_configuration_id,
        external_ref: fixed_stream.external_ref,
        location: fixed_stream.location,
        time_zone: fixed_stream.time_zone,
        title: fixed_stream.title,
        url_token: fixed_stream.url_token,
        first_measured_at: fixed_stream.first_measured_at,
        last_measured_at: fixed_stream.last_measured_at,
        created_at: Time.current,
        updated_at: Time.current,
      }
    end

    def copy_measurements_batch(stream_mappings, sub_batch_size: 10)
      return 0 if stream_mappings.empty?

      total = 0
      stream_mappings.each_slice(sub_batch_size) do |sub_batch|
        values =
          sub_batch
            .map { |ss_id, fs_id| "(#{ss_id.to_i}, #{fs_id.to_i})" }
            .join(', ')

        result = ActiveRecord::Base.connection.execute(<<~SQL)
            INSERT INTO station_measurements (station_stream_id, measured_at, value, created_at, updated_at)
            SELECT
              m.station_stream_id,
              fm.measured_at,
              fm.value,
              NOW(),
              NOW()
            FROM (VALUES #{values}) AS m(station_stream_id, fixed_stream_id)
            JOIN fixed_measurements fm ON fm.fixed_stream_id = m.fixed_stream_id
            WHERE fm.measured_at IS NOT NULL
            ON CONFLICT (station_stream_id, measured_at) DO NOTHING
          SQL
        total += result.cmd_tuples
      end
      total
    end

    def log(message)
      logger.info("[EeaDataMigrator] #{message}")
    end
  end
end
