module Api
  class UpdateSession
    def initialize(contract:)
      @contract = contract
    end

    def call
      return Failure.new(contract.errors) if contract.failure?

      session = Session.find_by_uuid(data[:uuid])
      unless session
        return Failure.new("Session with uuid: #{data[:uuid]} doesn't exist")
      end

      session.sync(data)
      session.reload

      Success.new(session)
    end

    private

    attr_reader :contract

    def data
      contract.to_h
    end
  end
end
