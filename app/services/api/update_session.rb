module Api
  class UpdateSession
    def initialize(contract:, user:)
      @contract = contract
      @user = user
    end

    def call
      return Failure.new(contract.errors) if contract.failure?

      session = user.sessions.find_by_uuid(data[:uuid])
      unless session
        return Failure.new("Session with uuid: #{data[:uuid]} doesn't exist")
      end

      session.sync(data)
      session.reload

      Success.new(session)
    end

    private

    attr_reader :contract, :user

    def data
      contract.to_h
    end
  end
end
