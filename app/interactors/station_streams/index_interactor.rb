module StationStreams
  class IndexInteractor
    def initialize(
      contract:,
      repository: StationStreamsRepository.new,
      serializer: StationStreamsSerializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call
      return Failure.new(contract.errors.to_h) if contract.failure?

      station_streams =
        repository.active_in_rectangle(
          sensor_name: data[:sensor_name],
          east: data[:east],
          west: data[:west],
          north: data[:north],
          south: data[:south],
        )

      Success.new(serializer.call(station_streams))
    end

    private

    attr_reader :contract, :repository, :serializer

    def data
      contract.to_h
    end
  end
end
