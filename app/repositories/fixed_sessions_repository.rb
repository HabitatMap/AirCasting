class FixedSessionsRepository
  def find_by(user_id:, uuid:)
    FixedSession.find_by(user_id: user_id, uuid: uuid)
  end

  def active_with_streams
    FixedSession
      .includes(:streams, :user)
      .where('last_measurement_at > ?', Time.current - FixedSession::ACTIVE_FOR)
  end

  def update_end_timestamps!(session:, last_measurement:)
    session.end_time_local = last_measurement.time
    session.last_measurement_at = last_measurement.time_with_time_zone

    session.save!
  end
end
