module DataFixes
  class EpaDataMigrator
    def call
      source_id = fetch_source_id
      stream_configurations = fetch_stream_configurations

      Stream
        .joins(session: :user)
        .where(users: { username: 'US EPA AirNow' })
        .includes(:session)
        .find_in_batches(batch_size: 500) do |streams|
          streams.each do |stream|
            migrate_stream(stream, source_id, stream_configurations)
          end
        end
    end

    private

    attr_reader :time_zone_finder

    def fetch_source_id
      Source.find_or_create_by(name: 'EPA').id
    end

    def fetch_stream_configurations
      stream_configurations =
        StreamConfiguration.where(canonical: true).index_by(&:measurement_type)

      {
        'Government-PM2.5' => stream_configurations['PM2.5'].id,
        'Government-NO2' => stream_configurations['NO2'].id,
        'Government-Ozone' => stream_configurations['Ozone'].id,
      }
    end

    def migrate_stream(stream, source_id, stream_configurations)
      stream_configuration_id = stream_configurations[stream.sensor_name]

      first_measured_at, last_measured_at =
        FixedMeasurement
          .where(stream_id: stream.id)
          .pick(
            Arel.sql('MIN(time_with_time_zone)'),
            Arel.sql('MAX(time_with_time_zone)'),
          )

      session = stream.session
      FixedStream.transaction do
        fixed_stream =
          FixedStream.create!(
            source_id: source_id,
            stream_configuration_id: stream_configuration_id,
            external_ref: session.uuid,
            location: location(session.latitude, session.longitude),
            time_zone: session.time_zone,
            title: session.title,
            url_token: session.url_token,
            first_measured_at: first_measured_at,
            last_measured_at: last_measured_at,
          )

        FixedMeasurement
          .where(stream_id: stream.id)
          .in_batches(of: 50_000) do |rel|
            rel.update_all(
              fixed_stream_id: fixed_stream.id,
              measured_at: Arel.sql('time_with_time_zone'),
              updated_at: Time.current,
            )
          end
      end
    end

    def spherical_factory
      @spherical_factory ||= RGeo::Geographic.spherical_factory(srid: 4326)
    end

    def location(latitude, longitude)
      spherical_factory.point(longitude, latitude)
    end
  end
end
