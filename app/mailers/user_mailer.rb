class UserMailer < ApplicationMailer
  def session_stopped_email
    @user = params[:user]
    @title = params[:title]
    @time = params[:time]
    mail(to: @user.email, subject: "#{@title} stopped streaming at #{@time}")
  end

  def export_sessions
    attachments[params[:zip_filename]] = params[:zip_file]

    mail(to: params[:email], subject: 'Exported AirCasting Sessions')
  end

  def threshold_exceeded_email
    user = params[:user]
    @title = params[:title]
    @sensor = params[:sensor]

    mail(to: user.email, subject: "#{@sensor} Threshold Exceeded")
  end
end
