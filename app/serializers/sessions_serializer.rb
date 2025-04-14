class SessionsSerializer
  def call(sessions:)
    { sessions: sessions.map { |session| serialized_session(session) } }
  end

  private

  def serialized_session(session)
    {
      id: session.id,
      title: session.title,
      start_datetime: formatted_datetime(session.start_time_local),
      end_datetime: formatted_datetime(session.end_time_local),
      type: session.type,
      streams:
        session.streams.map do |stream|
          {
            id: stream.id,
            sensor_name: stream.sensor_name,
            measurement_type: stream.measurement_type,
          }
        end,
    }
  end

  def formatted_datetime(datetime)
    datetime.strftime('%Y-%m-%dT%H:%M:%S')
  end
end
