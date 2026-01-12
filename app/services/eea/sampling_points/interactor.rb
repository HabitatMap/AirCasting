module Eea
  module SamplingPoints
    class Interactor
      def initialize(
        importer: Importer.new,
        repository: Eea::Repository.new,
        defaults_fetcher: StreamsDefaultValuesFetcher.new
      )
        @importer = importer
        @repository = repository
        @defaults_fetcher = defaults_fetcher
      end

      def call(directory = 'app/services/eea/sampling_points/data')
        csv_paths = Dir.glob(File.join(directory, '*.csv'))
        csv_paths.each do |csv_path|
          sampling_points = importer.call(file_path: csv_path)
          create_fixed_streams(sampling_points)
        end
      end

      private

      attr_reader :importer, :repository, :defaults_fetcher

      def create_fixed_streams(sampling_points)
        user = repository.eea_user
        stream_defaults = defaults_fetcher.call
        current_time = Time.current

        ApplicationRecord.transaction do
          session_params =
            sampling_points.map do |sp|
              {
                user_id: user.id,
                type: 'FixedSession',
                title: sp.title,
                latitude: sp.latitude,
                longitude: sp.longitude,
                time_zone: sp.time_zone,
                uuid: SecureRandom.uuid,
                url_token: sp.url_token,
                contribute: true,
                is_indoor: false,
                created_at: current_time,
                updated_at: current_time,
              }
            end

          session_ids =
            repository.insert_sessions!(session_params: session_params)

          stream_params =
            sampling_points.each_with_index.map do |sp, idx|
              defaults = stream_defaults[sp.measurement_type]

              {
                session_id: session_ids[idx],
                sensor_name: defaults.fetch(:sensor_name),
                unit_name: defaults.fetch(:unit_name),
                measurement_type: defaults.fetch(:measurement_type),
                measurement_short_type: defaults.fetch(:measurement_short_type),
                unit_symbol: defaults.fetch(:unit_symbol),
                sensor_package_name: 'eea',
                threshold_set_id: defaults.fetch(:threshold_set_id),
                min_latitude: sp.latitude,
                max_latitude: sp.latitude,
                min_longitude: sp.longitude,
                max_longitude: sp.longitude,
                start_latitude: sp.latitude,
                start_longitude: sp.longitude,
              }
            end

          stream_ids = repository.insert_streams!(stream_params: stream_params)

          fixed_streams_params =
            sampling_points.each_with_index.map do |sp, idx|
              {
                external_ref: sp.external_ref,
                location: sp.location,
                time_zone: sp.time_zone,
                title: sp.title,
                url_token: sp.url_token,
                source_id: sp.source_id,
                stream_configuration_id: sp.stream_configuration_id,
                stream_id: stream_ids[idx],
                created_at: current_time,
                updated_at: current_time,
              }
            end

          repository.insert_fixed_streams!(
            fixed_streams_params: fixed_streams_params,
          )
        end
      end
    end
  end
end
