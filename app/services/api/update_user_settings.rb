class Api::UpdateUserSettings
  def initialize(form:, user:)
    @form = form
    @user = user
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    user.session_stopped_alert = data.session_stopped_alert
    user.save

    Success.new(
      action: "session_stopped_alert was set to #{data.session_stopped_alert}"
    )
  end

  private

  attr_reader :form, :user

  def data
    form.to_h
  end
end
