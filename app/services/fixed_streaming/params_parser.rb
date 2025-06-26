module FixedStreaming
  class ParamsParser
    def initialize(
      contract: Contract.new,
      fixed_sessions_repository: FixedSessionsRepository.new
    )
      @contract = contract
      @fixed_sessions_repository = fixed_sessions_repository
    end

    def call(data:, compression:, user_id:)
      data_flow, decoded_data = decode_data(data, compression)
      validation_result = validate_data(decoded_data)

      return validation_result if validation_result.failure?

      data = validation_result.value
      session = session(user_id: user_id, session_uuid: data[:session_uuid])

      if session
        Success.new({ session: session, data: data, data_flow: data_flow })
      else
        Failure.new('session not found')
      end
    end

    private

    attr_reader :contract, :fixed_sessions_repository

    def decode_data(data, compression)
      data_flow = nil

      if compression
        data_flow = :sync
        decoded = Base64.decode64(data)
        unzipped = AirCasting::GZip.inflate(decoded)
      else
        data_flow = :live
        unzipped = data
      end

      [data_flow, ActiveSupport::JSON.decode(unzipped)]
    end

    def validate_data(data)
      contract_result = contract.call(data)

      if contract_result.failure?
        return Failure.new(contract_result.errors.to_h)
      end

      data = contract_result.to_h
      measurements =
        data[:measurements].reject { |m| m[:time] > 48.hours.from_now }

      if measurements.empty?
        return Failure.new('no measurements with valid time found')
      end

      data[:measurements] = measurements
      Success.new(data)
    end

    def session(user_id:, session_uuid:)
      fixed_sessions_repository.find_by(user_id: user_id, uuid: session_uuid)
    end
  end
end
