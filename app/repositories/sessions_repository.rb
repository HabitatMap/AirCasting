class SessionsRepository
  def find_with_streams(uuid:)
    Session.includes(streams: :threshold_set).find_by(uuid: uuid)
  end
end
