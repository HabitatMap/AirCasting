require 'sidekiq-scheduler'

class SessionStoppedAlertsWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_session_stopped_alerts_enabled

    # FixedSession, not Session: a stop-alert answers "your monitor went quiet",
    # which only a fixed session can. Mobile rows stay out of the window today
    # only because their last_measurement_at is NULL and NULL fails BETWEEN — an
    # accident that ends when the column is populated for mobile sessions, at
    # which point every mobile user with the toggle on would be mailed after
    # every recording. Whether mobile sessions should raise stop-alerts at all is
    # a notifications question, not this one.
    FixedSession
      .where(
        'last_measurement_at BETWEEN ? AND ?',
        Time.current - 1.hour,
        Time.current - 30.minutes
      )
      .joins(:user)
      .where(users: { session_stopped_alert: true })
      .each do |session|
        UserMailer
          .with(
            user: session.user,
            title: session.title,
            time: session.last_measurement_at.strftime('%m/%d/%y %k:%M %Z')
          )
          .session_stopped_email
          .deliver_later
      end
  end
end
