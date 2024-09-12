class SessionsRepository
  def find_with_streams(uuid:)
    Session.includes(streams: :threshold_set).find_by(uuid: uuid)
  end

  def active_in_last_7_days
    Session.where('last_measurement_at > ?', Time.current - 7.days)
  end
end
