require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    alerts = ThresholdAlert.all

    alerts.each do |alert|
      next if was_recently_sent?(alert)

      session = Session.joins(:streams).find_by_uuid(alert.session_uuid)
      stream = session.streams.select { |stream| stream.sensor_name == alert.sensor_name }.first
      measurements = stream&.measurements.where('time > ?', alert.last_email_at).order('time ASC')

      measurements_above_threshold = measurements.select { |m| m.value > alert.threshold_value }

      unless measurements_above_threshold.empty?
        UserMailer
        .with(
          user: session.user,
          title: session.title,
          sensor: stream.sensor_name,
          measurements: measurements_above_threshold
        )
        .threshold_exceeded_email
        .deliver_now
      end
    end
  end

  private

  def was_recently_sent?(alert)
    (alert.last_email_at + alert.frequency.hours) > Time.current
  end
end