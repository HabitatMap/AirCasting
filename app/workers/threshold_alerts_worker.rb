require 'sidekiq-scheduler'

class ThresholdAlertsWorker
  include Sidekiq::Worker

  def perform
    alerts = ThresholdAlert.all
    start_time = Time.current
    Sidekiq.logger.info "Starting ThresholdAlertsWorker at #{start_time}"

    Sidekiq
      .logger.info "[TRSHLD] #{alerts.count} alerts found: #{alerts.inspect}"

    alerts.each do |alert|
      if was_recently_sent?(alert)
        Sidekiq
          .logger.warn "[TRSHLD] Alert ##{alert.id} skipped, recently sent: #{alert.inspect}"
        next
      end

      # next if was_recently_sent?(alert)

      session = Session.joins(:streams).find_by_uuid(alert.session_uuid)
      unless session
        Sidekiq
          .logger.warn "[TRSHLD] Alert ##{alert.id} skipped, session with UUID ##{alert.session_uuid} not found: #{alert.inspect}"
        next
      end

      # next unless session

      stream =
        session
          .streams
          .select { |stream| stream.sensor_name == alert.sensor_name }
          .first
      unless stream
        Sidekiq
          .logger.warn "[TRSHLD] Alert ##{alert.id} skipped, stream with sensor name '#{alert.sensor_name}' not found: #{alert.inspect}"
        next
      end

      # next unless stream

      date_to_compare = alert.last_email_at || alert.created_at # Those are in UTC
      date_to_compare_local = date_to_compare + alert.timezone_offset

      measurements =
        stream
          .measurements
          .where('time > ?', date_to_compare_local)
          .order('time ASC') # Measurement#time is local
      Sidekiq
        .logger.info "[TRSHLD] Found #{measurements.count} measurements since #{date_to_compare}: #{measurements.inspect} for alert ##{alert.id}."

      measurements_above_threshold =
        measurements&.select { |m| m.value > alert.threshold_value }

      unless measurements_above_threshold.empty?
        UserMailer
          .with(
            user: session.user,
            title: session.title,
            sensor: stream.sensor_name,
          )
          .threshold_exceeded_email
          .deliver_later

        alert.update(last_email_at: Time.current)
        Sidekiq.logger.info(
          "[TRSHLD] Alert ##{alert.id} sent: #{alert.inspect}",
        )
      else
        Sidekiq
          .logger.warn "[TRSHLD] Alert ##{alert.id} skipped, no new measurements above threshold: #{alert.inspect}"
      end
    end

    end_time = Time.current
    Sidekiq.logger.info "Finished ThresholdAlertsWorker at #{end_time}"
    Sidekiq.logger.info "Total time taken: #{end_time - start_time} seconds"
  end

  private

  def was_recently_sent?(alert)
    return false unless alert.last_email_at

    (alert.last_email_at + alert.frequency.hours) > Time.current
  end
end
