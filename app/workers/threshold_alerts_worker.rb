require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_threshold_exceeded_alerts_enabled

    current_time = Time.current
    alerts = ThresholdAlert.joins(:user).all

    alerts.each do |alert|
      next if was_recently_sent?(alert, current_time)

      session = Session.joins(:streams).find_by_uuid(alert.session_uuid)
      next unless session

      stream =
        session
          .streams
          .select { |stream| stream.sensor_name == alert.sensor_name }
          .first

      next unless stream

      threshold_exceeded = measurements_above_threshold?(stream.id, alert)

      ActiveRecord::Base.transaction do
        alert.update!(last_check_at: current_time)

        alert.update!(last_email_at: current_time) if threshold_exceeded
      end

      if threshold_exceeded
        send_email(alert.user, session.title, stream.sensor_name)
      end
    end
  end

  private

  def was_recently_sent?(alert, current_time)
    return false unless alert.last_email_at

    (alert.last_email_at + alert.frequency.hours) > current_time
  end

  def measurements_above_threshold?(stream_id, alert)
    time_to_compare =
      alert.last_email_at || alert.last_check_at || alert.created_at

    Measurement
      .where(stream_id: stream_id)
      .where('time_with_time_zone >= ?', time_to_compare)
      .where('value > ?', alert.threshold_value)
      .exists?
  end

  def send_email(user, title, sensor)
    UserMailer
      .with(user: user, title: title, sensor: sensor)
      .threshold_exceeded_email
      .deliver_later
  end
end
