require 'sidekiq-scheduler'

class SessionStoppedAlertsWorker
  include Sidekiq::Worker

  def perform
    Session.where(
      'last_measurement_at BETWEEN ? AND ?',
      Time.current - 1.hour,
      Time.current - 30.minutes
    )
      .joins(:user)
      .where(users: { session_stopped_alert: true })
      .each do |session|
      UserMailer.with(
        user: session.user,
        title: session.title,
        time: session.last_measurement_at.strftime('%m/%d/%y %k:%M %Z')
      )
        .session_stopped_email
        .deliver_now
    end
  end
end
