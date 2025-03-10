class Api::ToUserSessionsHash
  def initialize(contract:)
    @contract = contract
  end

  def call(user)
    return Failure.new(contract.errors.to_h) if contract.failure?

    Success.new(user.sync(contract.to_h[:data].map(&:to_h)))
  end

  private

  attr_reader :contract
end
