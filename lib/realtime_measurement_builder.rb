class RealtimeMeasurementBuilder
  def initialize(session_uuid, stream_data, user)
    @session_uuid = session_uuid
    @stream_data = stream_data
    @user = user
  end

  def build!
    Session.transaction { session = build_measurement! }
  end

  def build_measurement!
    session = FixedSession.where(uuid: @session_uuid, user_id: @user.id).first

    return false unless session

    @stream_data.values.each do |a_stream|
      a_stream.merge!(:session_id => session.id)
      Stream.build_or_update!(a_stream)
    end
  end
end
