class UserMailer < ApplicationMailer

  def session_stopped_email(user, sessions)
    @user = user
    @sessions = sessions
    mail(to: user.email, subject: "Session Stopped Alert")
  end
end
