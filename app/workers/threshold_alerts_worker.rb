require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    alerts = ThresholdAlert.all

    alerts.each do |alert|
      next if was_recently_sent?(alert)

      session = Session.joins(:streams).find_by_uuid(alert.session_uuid)
      stream = session.streams.select { |stream| stream.sensor_name == alert.sensor_name }.first

      date_to_compare = alert.last_email_at || alert.created_at
      measurements = stream&.measurements.where('time > ?', date_to_compare).order('time ASC')

      measurements_above_threshold = measurements.select { |m| m.value > alert.threshold_value }

      unless measurements_above_threshold.empty?
        UserMailer
        .with(
          user: session.user,
          title: session.title,
          sensor: stream.sensor_name,
        )
        .threshold_exceeded_email
        .deliver_now

        alert.update(last_email_at: Time.current)
      end
    end
  end

  private

  def was_recently_sent?(alert)
    return false unless alert.last_email_at

    (alert.last_email_at + alert.frequency.hours) > Time.current
  end
end
