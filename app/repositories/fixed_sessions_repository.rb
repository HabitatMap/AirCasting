class FixedSessionsRepository
  def find_by(user_id:, uuid:)
    FixedSession.by_uuid(uuid).find_by(user_id: user_id)
  end

  def active_with_streams
    FixedSession
      .includes(:streams, :user)
      .where('last_measurement_at > ?', Time.current - FixedSession::ACTIVE_FOR)
  end

  # AirBeam ingest only; the government loaders write these columns themselves.
  # `last_measurement_at` is when the device last reached us, not the reading's
  # own time — it is the dormancy signal, and a backlog sync means awake. Gov
  # stations set it from the measurement time on purpose: one reporting six hours
  # late is six hours stale. `end_time_local` is the data's end, so a backlog
  # must not drag it back behind readings already stored.
  def update_timestamps_after_ingest!(session:, last_measurement:)
    if last_measurement.time > session.end_time_local
      session.end_time_local = last_measurement.time
    end
    session.last_measurement_at = Time.current

    session.save!
  end

  def update_start_time_local_if_earlier!(session:, first_measurement:)
    return unless first_measurement.time < session.start_time_local

    session.update!(start_time_local: first_measurement.time)
  end
end
