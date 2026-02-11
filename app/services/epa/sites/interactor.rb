module Epa
  module Sites
    class Interactor
      def initialize(
        api_client: Epa::ApiClient.new,
        data_parser: DataParser.new,
        repository: Epa::Repository.new,
        token_generator: TokenGenerator.new
      )
        @api_client = api_client
        @data_parser = data_parser
        @repository = repository
        @token_generator = token_generator
      end

      def call
        data = api_client.fetch_locations
        sites = data_parser.call(data: data)
        new_sites = filter_new_sites(sites)

        return if new_sites.empty?

        assign_url_tokens(new_sites)
        create_fixed_streams(new_sites)
      end

      private

      attr_reader :api_client, :data_parser, :repository, :token_generator

      def filter_new_sites(sites)
        existing_keys = existing_fixed_stream_keys

        sites.reject do |site|
          existing_keys.include?(
            [site.source_id, site.stream_configuration_id, site.external_ref],
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
        @source_id ||= Source.find_by!(name: 'EPA').id
      end

      def assign_url_tokens(sites)
        sites.each do |site|
          site.url_token = generate_url_token
        end
      end

      def generate_url_token
        token_generator.generate_unique(6) do |token|
          FixedStream.where(url_token: token).count.zero?
        end
      end

      def create_fixed_streams(sites)
        user = repository.epa_user
        stream_defaults = repository.stream_defaults
        current_time = Time.current

        ApplicationRecord.transaction do
          session_params =
            sites.map do |site|
              {
                user_id: user.id,
                type: 'FixedSession',
                title: site.title,
                latitude: site.latitude,
                longitude: site.longitude,
                time_zone: site.time_zone,
                uuid: SecureRandom.uuid,
                url_token: site.url_token,
                contribute: true,
                is_indoor: false,
                created_at: current_time,
                updated_at: current_time,
              }
            end

          session_ids =
            repository.insert_sessions!(session_params: session_params)

          stream_params =
            sites.each_with_index.map do |site, idx|
              defaults = stream_defaults[site.measurement_type]

              {
                session_id: session_ids[idx],
                sensor_name: defaults.fetch(:sensor_name),
                unit_name: defaults.fetch(:unit_name),
                measurement_type: defaults.fetch(:measurement_type),
                measurement_short_type: defaults.fetch(:measurement_short_type),
                unit_symbol: defaults.fetch(:unit_symbol),
                sensor_package_name: 'epa',
                threshold_set_id: defaults.fetch(:threshold_set_id),
                min_latitude: site.latitude,
                max_latitude: site.latitude,
                min_longitude: site.longitude,
                max_longitude: site.longitude,
                start_latitude: site.latitude,
                start_longitude: site.longitude,
              }
            end

          stream_ids = repository.insert_streams!(stream_params: stream_params)

          fixed_streams_params =
            sites.each_with_index.map do |site, idx|
              {
                external_ref: site.external_ref,
                location: site.location,
                time_zone: site.time_zone,
                title: site.title,
                url_token: site.url_token,
                source_id: site.source_id,
                stream_configuration_id: site.stream_configuration_id,
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
