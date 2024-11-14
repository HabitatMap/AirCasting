require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    return unless A9n.sidekiq_threshold_exceeded_alerts_enabled

    alerts = ThresholdAlert.all

    alerts.each do |alert|
      next if was_recently_sent?(alert)

      session = Session.joins(:streams).find_by_uuid(alert.session_uuid)
      next unless session

      stream =
        session
          .streams
          .select { |stream| stream.sensor_name == alert.sensor_name }
          .first

      date_to_compare = alert.last_email_at || alert.created_at

      if measurements_above_threshold?(
           stream.id,
           date_to_compare,
           alert.threshold_value,
         )
        UserMailer
          .with(
            user: session.user,
            title: session.title,
            sensor: stream.sensor_name,
          )
          .threshold_exceeded_email
          .deliver_later

        alert.update(last_email_at: Time.current)
      end
    end
  end

  private

  def was_recently_sent?(alert)
    return false unless alert.last_email_at

    (alert.last_email_at + alert.frequency.hours) > Time.current
  end

  def measurements_above_threshold?(stream_id, time_to_compare, threshold_value)
    Measurement
      .where(stream_id: stream_id)
      .where('time_with_time_zone > ?', time_to_compare)
      .where('value > ?', threshold_value)
      .exists?
  end
end
