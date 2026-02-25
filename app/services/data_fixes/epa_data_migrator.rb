module DataFixes
  class EpaDataMigrator
    def initialize(
      api_client: Epa::ApiClient.new,
      data_parser: Epa::Stations::DataParser.new
    )
      @api_client = api_client
      @data_parser = data_parser
    end

    def call
      source_id = fetch_source_id
      stream_configurations = fetch_stream_configurations
      aqsid_by_location = build_aqsid_lookup
      already_migrated_keys = fetch_already_migrated_keys(source_id)

      log("Source ID: #{source_id}")
      log(
        "Stream configurations: #{stream_configurations.transform_values { |v| v&.id }}",
      )
      log("AQSID lookup size: #{aqsid_by_location.size}")
      log("Sample AQSID keys: #{aqsid_by_location.keys.first(3).inspect}")
      log("Already migrated: #{already_migrated_keys.size}")
      log("Streams to migrate: #{streams_to_migrate.count}")

      migrated = 0
      skipped = 0
      unmatched = []
      fake_refs = []
      errors = []

      streams_to_migrate.find_in_batches(batch_size: 50) do |streams|
        streams_to_process =
          streams.reject do |stream|
            sc_id = stream_configurations[stream.sensor_name]&.id
            already_migrated_keys.include?([stream.session.uuid, sc_id])
          end
        skipped += streams.size - streams_to_process.size

        next if streams_to_process.empty?

        stream_ids = streams_to_process.map(&:id)
        bounds_by_stream_id = fetch_bounds_batch(stream_ids)

        station_stream_attrs = []
        key_to_stream_id = {}

        streams_to_process.each do |stream|
          result =
            build_station_stream_attrs(
              stream,
              source_id,
              stream_configurations,
              aqsid_by_location,
              bounds_by_stream_id,
            )

          if result.nil?
            unmatched << {
              stream_id: stream.id,
              session_id: stream.session.id,
              title: stream.session.title,
              lat: stream.session.latitude,
              lng: stream.session.longitude,
              sensor_name: stream.sensor_name,
            }
          else
            attrs, is_fake = result
            station_stream_attrs << attrs
            sc_id = stream_configurations[stream.sensor_name].id
            key_to_stream_id[[stream.session.uuid, sc_id]] = stream.id

            if is_fake
              fake_refs << {
                stream_id: stream.id,
                session_id: stream.session.id,
                title: stream.session.title,
                lat: stream.session.latitude,
                lng: stream.session.longitude,
                sensor_name: stream.sensor_name,
                fake_external_ref: attrs[:external_ref],
              }
            end
          end
        end

        next if station_stream_attrs.empty?

        begin
          stream_mappings = nil
          streams_by_id = streams_to_process.index_by(&:id)

          ActiveRecord::Base.transaction do
            inserted =
              StationStream.insert_all(
                station_stream_attrs,
                returning: %w[id uuid stream_configuration_id],
              )

            stream_mappings =
              inserted.rows.filter_map do |ss_id, uuid, sc_id|
                old_stream_id = key_to_stream_id[[uuid, sc_id.to_i]]
                [ss_id, old_stream_id] if old_stream_id
              end

            copy_measurements_batch(stream_mappings)

            migrated += stream_mappings.size
          end

          stream_mappings&.each do |_ss_id, s_id|
            log("Migrated stream #{s_id} (#{streams_by_id[s_id]&.session&.title})")
          end
        rescue StandardError => e
          log("ERROR in batch: #{e.message}")
          errors << { batch_stream_ids: stream_ids, error: e.message }
        end

        log(
          "Progress: migrated=#{migrated}, skipped=#{skipped}, unmatched=#{unmatched.count}, fake_refs=#{fake_refs.count}, errors=#{errors.count}",
        )
      end

      {
        migrated: migrated,
        skipped: skipped,
        unmatched: unmatched,
        fake_refs: fake_refs,
        errors: errors,
      }
    end

    private

    attr_reader :api_client, :data_parser

    def fetch_source_id
      Source.find_by!(name: 'EPA').id
    end

    def fetch_stream_configurations
      stream_configurations =
        StreamConfiguration.where(canonical: true).index_by(&:measurement_type)

      {
        'Government-PM2.5' => stream_configurations['PM2.5'],
        'Government-NO2' => stream_configurations['NO2'],
        'Government-Ozone' => stream_configurations['Ozone'],
      }
    end

    def streams_to_migrate
      Stream
        .joins(session: :user)
        .where(users: { username: 'US EPA AirNow' })
        .includes(:session)
    end

    def fetch_already_migrated_keys(source_id)
      StationStream
        .where(source_id: source_id)
        .pluck(:uuid, :stream_configuration_id)
        .to_set
    end

    def log(message)
      Rails.logger.info("[EpaDataMigrator] #{message}")
    end

    def build_aqsid_lookup
      data = api_client.fetch_locations
      stations = data_parser.call(data: data)

      stations.each_with_object({}) do |station, lookup|
        key =
          location_key(
            station.latitude,
            station.longitude,
            station.measurement_type,
          )
        lookup[key] = station.external_ref
      end
    end

    def location_key(lat, lng, measurement_type)
      [lat.to_f.round(3), lng.to_f.round(3), measurement_type]
    end

    def legacy_measurement_type_to_new(sensor_name)
      case sensor_name
      when 'Government-PM2.5'
        'PM2.5'
      when 'Government-NO2'
        'NO2'
      when 'Government-Ozone'
        'Ozone'
      end
    end

    def fetch_bounds_batch(stream_ids)
      FixedMeasurement
        .where(stream_id: stream_ids)
        .group(:stream_id)
        .pluck(
          :stream_id,
          Arel.sql('MIN(time_with_time_zone)'),
          Arel.sql('MAX(time_with_time_zone)'),
        )
        .to_h { |stream_id, min, max| [stream_id, [min, max]] }
    end

    def copy_measurements_batch(stream_mappings, sub_batch_size: 10)
      return if stream_mappings.empty?

      stream_mappings.each_slice(sub_batch_size) do |sub_batch|
        values =
          sub_batch
            .map { |ss_id, s_id| "(#{ss_id.to_i}, #{s_id.to_i})" }
            .join(', ')

        sql = <<~SQL
          INSERT INTO station_measurements (station_stream_id, measured_at, value, created_at, updated_at)
          SELECT
            m.station_stream_id,
            fm.time_with_time_zone,
            fm.value,
            NOW(),
            NOW()
          FROM (VALUES #{values}) AS m(station_stream_id, stream_id)
          JOIN fixed_measurements fm ON fm.stream_id = m.stream_id
          ON CONFLICT (station_stream_id, measured_at) DO NOTHING
        SQL

        ActiveRecord::Base.connection.execute(sql)
      end
    end

    def build_station_stream_attrs(
      stream,
      source_id,
      stream_configurations,
      aqsid_by_location,
      bounds_by_stream_id
    )
      session = stream.session
      stream_configuration = stream_configurations[stream.sensor_name]

      return nil unless stream_configuration

      measurement_type = legacy_measurement_type_to_new(stream.sensor_name)
      key = location_key(session.latitude, session.longitude, measurement_type)
      aqsid = aqsid_by_location[key]
      external_ref = aqsid || "UNMATCHED-#{session.uuid}"
      is_fake = aqsid.nil?

      bounds = bounds_by_stream_id[stream.id]
      first_measured_at = bounds&.first
      last_measured_at = bounds&.last

      attrs = {
        source_id: source_id,
        stream_configuration_id: stream_configuration.id,
        external_ref: external_ref,
        location: build_location(session.latitude, session.longitude),
        time_zone: session.time_zone,
        title: session.title,
        url_token: session.url_token,
        uuid: session.uuid,
        first_measured_at: first_measured_at,
        last_measured_at: last_measured_at,
        created_at: Time.current,
        updated_at: Time.current,
      }

      [attrs, is_fake]
    end

    def spherical_factory
      @spherical_factory ||= RGeo::Geographic.spherical_factory(srid: 4326)
    end

    def build_location(latitude, longitude)
      spherical_factory.point(longitude, latitude)
    end
  end
end
