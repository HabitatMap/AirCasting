require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    alerts = ThresholdAlert.all

    alerts.each do |alert|
      if was_recently_sent?(alert)
        Rails.logger.tagged('TRSHLD') do
          logger.info "Alert ##{alert.id} skipped, recently sent."
        end
        next
      end
      # next if was_recently_sent?(alert)

      session = Session.joins(:streams).find_by_uuid(alert.session_uuid)
      unless session
        Rails.logger.tagged('TRSHLD') do
          logger.info "Alert ##{alert.id} skipped, session with UUID ##{alert.session_uuid} not found."
        end
        next
      end
      # next unless session

      stream = session.streams.select { |stream| stream.sensor_name == alert.sensor_name }.first
      unless stream
        Rails.logger.tagged('TRSHLD') do
          logger.info "Alert ##{alert.id} skipped, stream with alert's sensor name '#{alert.sensor_name}' not found."
        end
        next
      end
      # next unless stream

      date_to_compare = alert.last_email_at || alert.created_at
      measurements = stream.measurements.where('time > ?', date_to_compare).order('time ASC')

      measurements_above_threshold = measurements&.select { |m| m.value > alert.threshold_value }

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
      else
        Rails.logger.tagged('TRSHLD') do
          logger.info "Alert ##{alert.id} skipped, no measurements above threshold."
        end
      end
    end
  end

  private

  def was_recently_sent?(alert)
    return false unless alert.last_email_at

    (alert.last_email_at + alert.frequency.hours) > Time.current
  end
end
