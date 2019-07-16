class UserMailer < ApplicationMailer
  def session_stopped_email
    @user = params[:user]
    @session = params[:session]
    mail(
      to: @user.email,
      subject:
        "#{@session.title} stopped streaming at #{@session.last_measurement_at}"
    )
  end
end
