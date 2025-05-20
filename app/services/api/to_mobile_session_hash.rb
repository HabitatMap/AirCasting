class Api::ToMobileSessionHash
  def initialize(note_serializer: NoteSerializer.new, stream:)
    @note_serializer = note_serializer
    @stream = stream
  end

  def call
    {
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      sensorName: stream.sensor_name,
      measurements: measurements(stream),
      startTime: format_time(session.start_time_local),
      endTime: format_time(session.end_time_local),
      id: session.id,
      streamId: stream.id,
      sensorUnit: stream.unit_symbol,
      averageValue: stream.average_value.round,
      maxLatitude: stream.max_latitude,
      maxLongitude: stream.max_longitude,
      minLatitude: stream.min_latitude,
      minLongitude: stream.min_longitude,
      startLatitude: stream.start_latitude,
      startLongitude: stream.start_longitude,
      notes: notes.map { |note| note_serializer.call(note: note) },
    }
  end

  private

  attr_reader :note_serializer, :stream

  def session
    @session ||= stream.session
  end

  def notes
    @notes ||= session.notes
  end

  def format_time(time)
    time.to_datetime.strftime('%Q').to_i
  end

  def measurements(stream)
    @measurements ||=
      begin
        fields = %i[value time longitude latitude]
        stream
          .measurements
          .pluck(*fields)
          .map do |record_fields|
            {
              value: record_fields[0],
              time: format_time(record_fields[1]),
              longitude: record_fields[2],
              latitude: record_fields[3],
            }
          end
      end
  end
end
