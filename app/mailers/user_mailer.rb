class UserMailer < ApplicationMailer
  def session_stopped_email
    @user = params[:user]
    @title = params[:title]
    @time = params[:time]
    mail(to: @user.email, subject: "#{@title} stopped streaming at #{@time}")
  end
end
