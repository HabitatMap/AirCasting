module FixedStreaming
  class ParamsParser
    def initialize(fixed_sessions_repository: FixedSessionsRepository.new)
      @fixed_sessions_repository = fixed_sessions_repository
    end

    def call(params:, user_id:)
      data = parsed_params(params)
      session = session(user_id: user_id, session_uuid: data[:session_uuid])

      if session
        Success.new({ session: session, data: data })
      else
        Failure.new('session not found')
      end
    end

    private

    attr_reader :fixed_sessions_repository

    def parsed_params(params)
      if params[:compression]
        decoded = Base64.decode64(params[:data])
        unzipped = AirCasting::GZip.inflate(decoded)
      else
        unzipped = params[:data]
      end

      ActiveSupport::JSON.decode(unzipped).deep_symbolize_keys
    end

    def session(user_id:, session_uuid:)
      fixed_sessions_repository.find_by(user_id: user_id, uuid: session_uuid)
    end
  end
end
