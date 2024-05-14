class FixedSessionsRepository
  def active_with_streams
    FixedSession
      .includes(:streams, :user)
      .where('last_measurement_at > ?', Time.current - FixedSession::ACTIVE_FOR)
  end
end
