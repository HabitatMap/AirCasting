class Api::UpdateUserSettings
  def initialize(contract:, user:)
    @contract = contract
    @user = user
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    user.session_stopped_alert = session_stopped_alert
    user.save

    Success.new(
      action: "session_stopped_alert was set to #{session_stopped_alert}",
    )
  end

  private

  attr_reader :contract, :user

  def session_stopped_alert
    contract[:session_stopped_alert]
  end
end
