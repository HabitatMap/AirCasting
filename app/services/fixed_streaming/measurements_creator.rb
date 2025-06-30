module FixedStreaming
  class MeasurementsCreator
    def initialize(measurements_repository: MeasurementsRepository.new)
      @measurements_repository = measurements_repository
    end

    def call(data:, session:, stream:)
      shared_params = shared_params(session, stream)
      time_zone = session.time_zone

      measurements =
        data.map do |measurement_data|
          measurement_params =
            relevant_params_from_data(measurement_data, time_zone)

          Measurement.new(shared_params.merge(measurement_params))
        end
      import_result = measurements_repository.import(measurements: measurements)

      [import_result.num_inserts, measurements]
    end

    private

    attr_reader :measurements_repository

    def shared_params(session, stream)
      latitude = session.latitude
      longitude = session.longitude
      factory = RGeo::Geographic.spherical_factory(srid: 4326)

      {
        latitude: latitude,
        longitude: longitude,
        location: factory.point(longitude, latitude),
        stream: stream,
      }
    end

    def relevant_params_from_data(measurement_data, time_zone)
      value = measurement_data[:value]
      time = measurement_data[:time]
      time_with_time_zone = time.in_time_zone.change(zone: time_zone)

      { value: value, time: time, time_with_time_zone: time_with_time_zone }
    end
  end
end
