module FixedStreaming
  class StreamCreator
    def initialize(
      threshold_sets_repository: ThresholdSetsRepository.new,
      streams_repository: StreamsRepository.new
    )
      @threshold_sets_repository = threshold_sets_repository
      @streams_repository = streams_repository
    end

    def call(session:, data:)
      threshold_set = find_or_create_threshold_set(data)
      stream = create_stream!(data, session, threshold_set)

      stream
    end

    private

    attr_reader :threshold_sets_repository, :streams_repository

    def find_or_create_threshold_set(data)
      params = threshold_set_params(data)

      find_threshold_set(params) || create_threshold_set!(params)
    end

    def threshold_set_params(data)
      keys = %i[
        sensor_name
        unit_symbol
        threshold_high
        threshold_low
        threshold_medium
        threshold_very_high
        threshold_very_low
      ]

      data.slice(*keys)
    end

    def find_threshold_set(params)
      threshold_sets_repository.find_by(
        sensor_name: params[:sensor_name],
        unit_symbol: params[:unit_symbol],
      )
    end

    def create_threshold_set!(params)
      threshold_sets_repository.create!(params: params.merge(is_default: false))
    end

    def create_stream!(data, session, threshold_set)
      params = stream_params(data, session, threshold_set)

      streams_repository.create!(params: params)
    end

    def stream_params(data, session, threshold_set)
      keys = %i[
        sensor_name
        sensor_package_name
        unit_name
        unit_symbol
        measurement_type
        measurement_short_type
      ]

      data
        .slice(*keys)
        .merge(
          {
            session_id: session.id,
            threshold_set_id: threshold_set.id,
            min_latitude: session.latitude,
            max_latitude: session.latitude,
            min_longitude: session.longitude,
            max_longitude: session.longitude,
          },
        )
    end
  end
end
