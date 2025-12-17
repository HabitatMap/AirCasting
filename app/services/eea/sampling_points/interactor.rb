module Eea
  module SamplingPoints
    class Interactor
      def initialize(importer: Importer.new, repository: Eea::Repository.new)
        @importer = importer
        @repository = repository
      end

      def call(directory = 'app/services/eea/sampling_points/data')
        csv_paths = Dir.glob(File.join(directory, '*.csv'))
        csv_paths.each do |csv_path|
          sampling_points = importer.call(file_path: csv_path)
          create_fixed_streams(sampling_points)
        end
      end

      private

      attr_reader :importer, :repository

      def create_fixed_streams(sampling_points)
        fixed_streams_params =
          sampling_points.map do |sp|
            {
              external_ref: sp.external_ref,
              location: sp.location,
              time_zone: sp.time_zone,
              title: sp.title,
              url_token: sp.url_token,
              source_id: sp.source_id,
              stream_configuration_id: sp.stream_configuration_id,
              created_at: Time.current,
              updated_at: Time.current,
            }
          end

        repository.insert_fixed_streams(
          fixed_streams_params: fixed_streams_params,
        )
      end
    end
  end
end
