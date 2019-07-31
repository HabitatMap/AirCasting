class UserMailer < ApplicationMailer
  def session_stopped_email
    @user = params[:user]
    @title = params[:title]
    @time = params[:time]
    mail(to: @user.email, subject: "#{@title} stopped streaming at #{@time}")
  end

  def export_sessions
    attachments[params[:zip_filename]] = params[:zip_file]

    mail(to: params[:email], subject: 'Exported Sessions')
  end
end
