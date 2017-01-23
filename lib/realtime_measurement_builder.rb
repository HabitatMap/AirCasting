class RealtimeMeasurementBuilder
  def initialize(session_uuid, stream_data, user)
    @session_uuid = session_uuid
    @stream_data = stream_data
    @user = user
    @streams_repository = StreamsRepository.new
  end

  def build!
    Session.transaction { session = build_measurement! }
  end

  def build_measurement!
    session = FixedSession.where(uuid: session_uuid, user_id: user.id).first

    return false unless session

    stream_data.values.each do |a_stream|
      a_stream.merge!(:session_id => session.id)
      stream = Stream.build_or_update!(a_stream)
      streams_repository.calc_bounding_box!(stream)
    end
  end

  private
  attr_reader :session_uuid, :stream_data, :user, :streams_repository
end
