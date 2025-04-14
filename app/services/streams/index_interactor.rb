module Streams
  class IndexInteractor
    def initialize(
      streams_repository: StreamsRepository.new,
      streams_with_messurements_serializer: StreamsWithMeasurementsSerializer
        .new
    )
      @streams_with_measurements_serializer =
        streams_with_messurements_serializer
      @streams_repository = streams_repository
    end

    def call(sensor_package_name:)
      streams =
        streams_repository.all_by_sensor_package(
          sensor_package_name: sensor_package_name,
        )
      result = streams_with_measurements_serializer.call(streams: streams)

      Success.new(result)
    end

    private

    attr_reader :streams_repository, :streams_with_measurements_serializer
  end
end
