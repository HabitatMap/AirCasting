module Eea
  module SamplingPoints
    class StreamsDefaultValuesFetcher
      def initialize(repository: Repository.new)
        @repository = repository
      end

      def call
        threshold_sets =
          repository.air_now_threshold_sets.index_by(&:sensor_name)

        {
          'PM2.5' => {
            sensor_name: 'Government-PM2.5',
            unit_name: 'microgram per cubic meter',
            measurement_type: 'Particulate Matter',
            measurement_short_type: 'PM',
            unit_symbol: 'µg/m³',
            threshold_set_id: threshold_sets['Government-PM2.5']&.id,
            sensor_package_name: 'Government-PM2.5',
          },
          'NO2' => {
            sensor_name: 'Government-NO2',
            unit_name: 'parts per billion',
            measurement_type: 'Nitrogen Dioxide',
            measurement_short_type: 'NO2',
            unit_symbol: 'ppb',
            threshold_set_id: threshold_sets['Government-NO2']&.id,
            sensor_package_name: 'Government-NO2',
          },
          'Ozone' => {
            sensor_name: 'Government-Ozone',
            unit_name: 'parts per billion',
            measurement_type: 'Ozone',
            measurement_short_type: 'O3',
            unit_symbol: 'ppb',
            threshold_set_id: threshold_sets['Government-Ozone']&.id,
            sensor_package_name: 'Government-Ozone',
          },
        }
      end

      private

      attr_reader :repository
    end
  end
end
