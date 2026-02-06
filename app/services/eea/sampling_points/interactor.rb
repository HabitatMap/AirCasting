module Eea
  module SamplingPoints
    class Interactor
      DEFAULT_DIRECTORY = 'app/services/eea/sampling_points/data'.freeze

      def initialize(
        importer: Importer.new,
        repository: Eea::Repository.new,
        defaults_fetcher: StreamsDefaultValuesFetcher.new,
        token_generator: TokenGenerator.new
      )
        @importer = importer
        @repository = repository
        @defaults_fetcher = defaults_fetcher
        @token_generator = token_generator
      end

      def call(directory: DEFAULT_DIRECTORY)
        csv_paths = Dir.glob(File.join(directory, '*.csv'))

        csv_paths.each do |csv_path|
          sampling_points = importer.call(file_path: csv_path)
          new_sampling_points = filter_new_sampling_points(sampling_points)

          next if new_sampling_points.empty?

          assign_url_tokens(new_sampling_points)
          create_fixed_streams(new_sampling_points)
        end
      end

      private

      attr_reader :importer, :repository, :defaults_fetcher, :token_generator

      def filter_new_sampling_points(sampling_points)
        existing_keys = existing_fixed_stream_keys

        sampling_points.reject do |sp|
          existing_keys.include?(
            [sp.source_id, sp.stream_configuration_id, sp.external_ref],
          )
        end
      end

      def existing_fixed_stream_keys
        FixedStream
          .where(source_id: source_id)
          .pluck(:source_id, :stream_configuration_id, :external_ref)
          .to_set
      end

      def source_id
        @source_id ||= Source.find_by!(name: 'EEA').id
      end

      def assign_url_tokens(sampling_points)
        sampling_points.each do |sp|
          sp.url_token = generate_url_token
        end
      end

      def generate_url_token
        token_generator.generate_unique(6) do |token|
          FixedStream.where(url_token: token).count.zero?
        end
      end

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
