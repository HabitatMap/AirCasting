module FixedStreaming
  class FixedMeasurementsCreator
    def initialize(
      fixed_measurements_repository: FixedMeasurementsRepository.new
    )
      @fixed_measurements_repository = fixed_measurements_repository
    end

    def call(data:, time_zone:, stream:)
      measurements =
        data.map do |measurement_data|
          build_measurement(measurement_data, time_zone, stream)
        end

      import_result =
        fixed_measurements_repository.import(
          measurements: measurements,
          on_duplicate_key_ignore: true,
        )

      [import_result, measurements]
    end

    private

    attr_reader :fixed_measurements_repository

    def build_measurement(data, time_zone, stream)
      FixedMeasurement.new(
        value: data[:value],
        time: data[:time],
        time_with_time_zone: data[:time].in_time_zone.change(zone: time_zone),
        stream: stream,
      )
    end
  end
end
