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
        sensor_package_name_variants(params[:sensor_package_name]) if params[
        :sensor_package_name
      ].present?

      params
    end

    # Firmware stores the device id in one case only: lowercase before
    # AirBeam Mini FW 1.0.0, uppercase since. Exact variants keep the index.
    def sensor_package_name_variants(sensor_package_name)
      before_separator, separator, after_separator =
        sensor_package_name.partition(/[:\-]/)

      [after_separator.downcase, after_separator.upcase].uniq.map do |id|
        "#{before_separator}#{separator}#{id}"
      end
    end
  end
end
