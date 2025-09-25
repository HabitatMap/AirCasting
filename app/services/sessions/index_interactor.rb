module Sessions
  class IndexInteractor
    def initialize(
      contract: Contract.new,
      sessions_repository: SessionsRepository.new,
      sessions_serializer: SessionsSerializer.new
    )
      @contract = contract
      @sessions_repository = sessions_repository
      @session_serializer = sessions_serializer
    end

    def call(params:)
      validation_result = contract.call(params)

      return Failure.new(validation_result.errors) if validation_result.failure?

      sessions =
        sessions_repository.filter(
          params: normalized_params(validation_result.to_h),
        )
      result = session_serializer.call(sessions: sessions)

      Success.new(result)
    end

    private

    attr_reader :contract, :sessions_repository, :session_serializer

    def normalized_params(params)
      params[:sensor_package_name] =
        normalized_sensor_name(params[:sensor_package_name]) if params[
        :sensor_package_name
      ].present?

      params
    end

    def normalized_sensor_name(sensor_package_name)
      before_separator, separator, after_separator =
        sensor_package_name.partition(/[:\-]/)
      "#{before_separator}#{separator}#{after_separator.downcase}"
    end
  end
end
