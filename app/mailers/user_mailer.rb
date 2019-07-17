class UserMailer < ApplicationMailer
  def session_stopped_email
    @user = params[:user]
    @sessions = @user.sessions
    mail(to: @user.email, subject: 'Session Stopped Alert')
  end
end
