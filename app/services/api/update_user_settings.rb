class Api::UpdateUserSettings
  def initialize(contract:, user:)
    @contract = contract
    @user = user
  end

  def call
    # The message set, not `to_h`: `to_h` throws away the failing predicate,
    # and `ValidationErrorsSerializer` needs it to give each field a code.
    return Failure.new(contract.errors) if contract.failure?

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
