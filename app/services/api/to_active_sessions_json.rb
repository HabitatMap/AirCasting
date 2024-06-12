class Api::ToActiveSessionsJson
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?
    result = data[:is_indoor] ? build_json_output(true) : build_json_output
    Success.new(result)
  end

  private

  attr_reader :form

  def data
    # dry-struct allows for missing key using `meta(omittable: true)`
    # This `form` has such a key named `is_indoor`. Unfortunately, when
    # `is_indoor` in `nil` if accessed with `form.to_h[:is_indoor]`, the
    # library raises. The solutions are:
    #   - Using `form.is_indoor`; this in not viable at the moment cause
    #     the code that is accessing the struct (Session.filter_) is used
    #     by other callers that are passing a vanilla Ruby hash.
    #   - Passing a vanilla Ruby hash with `form.to_h.to_h`
    form.to_h.to_h
  end

  # this was changed from a mysql query to active record to work with postgres, but it might perform worse
  # this should be tested in terms of performance and actual queries generated vs. old mysql implementation
  def build_json_output(anonymous = false)
    sessions = formatted_sessions
    streams = Stream.where(session_id: sessions.pluck('sessions.id'))
    selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(data[:sensor_name]).include? stream.sensor_name.downcase }

    sessions_array = sessions.map do |session|
      related_stream = selected_sensor_streams.find { |stream| stream.session_id == session.id }
      last_average_value = StreamDailyAveragesRepository.new.last_average_value(related_stream.id)

      {
        'id' => session.id,
        'uuid' => session.uuid,
        'end_time_local' => session.end_time_local.strftime('%Y-%m-%dT%H:%M:%S.%LZ'),
        'start_time_local' => session.start_time_local.strftime('%Y-%m-%dT%H:%M:%S.%LZ'),
        'last_measurement_value' => related_stream&.average_value&.round,
        'is_indoor' => session.is_indoor,
        'latitude' => session.latitude,
        'longitude' => session.longitude,
        'title' => session.title,
        'username' => anonymous ? 'anonymous' : session.user.username,
        'streams' => {
          related_stream.sensor_name => {
            'measurement_short_type' => related_stream.measurement_short_type,
            'sensor_name' => related_stream.sensor_name,
            'unit_symbol' => related_stream.unit_symbol,
            'id' => related_stream.id,
            'stream_daily_average' => last_average_value,
          }
        }
      }
    end

    {
      'fetchableSessionsCount' => sessions.length,
      'sessions' => sessions_array
    }
  end

  def formatted_sessions
    sessions.select([
      'sessions.id',
      'sessions.uuid',
      'sessions.title',
      'sessions.start_time_local',
      'sessions.end_time_local',
      '(SELECT average_value FROM streams WHERE streams.session_id = sessions.id LIMIT 1)',
      'sessions.is_indoor',
      'sessions.latitude',
      'sessions.longitude',
      'users.username',
      'sessions.user_id',
    ])
  end

  def sessions
    @sessions ||= FixedSession.active.filter_(data)
  end
end
