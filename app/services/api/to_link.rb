class Api::ToLink
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    session = ::Session.find_by_url_token(data[:url_token]) or raise NotFound
    stream = session.streams.where(sensor_name: data[:sensor_name]).first!

    Success.new(session.generate_link(stream))
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end
end
