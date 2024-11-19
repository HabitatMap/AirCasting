require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_threshold_exceeded_alerts_enabled

    current_time = Time.current
    alerts = ThresholdAlert.joins(:user, stream: :session).all

    alerts.each do |alert|
      next if was_recently_sent?(alert, current_time)

      threshold_exceeded = measurements_above_threshold?(alert)

      ActiveRecord::Base.transaction do
        alert.update!(last_check_at: current_time)

        alert.update!(last_email_at: current_time) if threshold_exceeded
      end

      send_email(alert) if threshold_exceeded
    end
  end

  private

  def was_recently_sent?(alert, current_time)
    return false unless alert.last_email_at

    (alert.last_email_at + alert.frequency.hours) > current_time
  end

  def measurements_above_threshold?(alert)
    time_to_compare =
      alert.last_email_at || alert.last_check_at || alert.created_at

    Measurement
      .where(stream_id: alert.stream_id)
      .where('time_with_time_zone >= ?', time_to_compare)
      .where('value > ?', alert.threshold_value)
      .exists?
  end

  def send_email(alert)
    user = alert.user
    title = alert.stream.session.title
    sensor = alert.stream.sensor_name

    UserMailer
      .with(user: user, title: title, sensor: sensor)
      .threshold_exceeded_email
      .deliver_later
  end
end
