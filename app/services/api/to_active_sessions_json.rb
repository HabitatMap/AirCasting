class Api::ToActiveSessionsJson
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    result = data[:is_indoor] ? build_json_output(true) : build_json_output
    Success.new(result)
  end

  private

  attr_reader :contract

  # TODO: check if the comments is still valid
  def data
    # dry-struct allows for missing key using `meta(omittable: true)`
    # This `form` has such a key named `is_indoor`. Unfortunately, when
    # `is_indoor` in `nil` if accessed with `form.to_h[:is_indoor]`, the
    # library raises. The solutions are:
    #   - Using `form.is_indoor`; this in not viable at the moment cause
    #     the code that is accessing the struct (Session.filter_) is used
    #     by other callers that are passing a vanilla Ruby hash.
    #   - Passing a vanilla Ruby hash with `form.to_h.to_h`
    contract.to_h
  end

  # this was changed from a mysql query to active record to work with postgres, but it might perform worse
  # this should be tested in terms of performance and actual queries generated vs. old mysql implementation
  def build_json_output(anonymous = false)
    sessions = formatted_sessions
    streams =
      Stream
        .includes(:last_hourly_average)
        .left_joins(:last_hourly_average)
        .where(session_id: sessions.pluck('sessions.id'))
    selected_sensor_streams =
      streams.select do |stream|
        Sensor.sensor_name(data[:sensor_name]).include? stream.sensor_name
                                       .downcase
      end

    sessions_array =
      sessions.map do |session|
        related_stream =
          selected_sensor_streams.find do |stream|
            stream.session_id == session.id
          end
        last_average_value =
          StreamDailyAveragesRepository.new.last_average_value(
            related_stream.id,
          )

        {
          'id' => session.id,
          'uuid' => session.uuid,
          'end_time_local' =>
            session.end_time_local.strftime('%Y-%m-%dT%H:%M:%S.%LZ'),
          'start_time_local' =>
            session.start_time_local.strftime('%Y-%m-%dT%H:%M:%S.%LZ'),
          'last_measurement_value' =>
            anonymous ? last_measurement_value(related_stream.id) : nil,
          'is_indoor' => session.is_indoor,
          'latitude' => session.latitude,
          'longitude' => session.longitude,
          'title' => session.title,
          'username' => anonymous ? 'anonymous' : session.user.username,
          'is_active' => session.is_active,
          'last_hourly_average_value' =>
            related_stream.last_hourly_average_value,
          'streams' => {
            related_stream.sensor_name => {
              'measurement_short_type' => related_stream.measurement_short_type,
              'sensor_name' => related_stream.sensor_name,
              'unit_symbol' => related_stream.unit_symbol,
              'id' => related_stream.id,
              'stream_daily_average' => last_average_value&.round || 'no data',
            },
          },
        }
      end

    {
      'fetchableSessionsCount' => sessions.length,
      'sessions' => sessions_array,
    }
  end

  def formatted_sessions
    sessions.select(
      [
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
        'sessions.last_measurement_at',
      ],
    )
  end

  def sessions
    @sessions ||= FixedSession.active.filter_(data)
  end

  def last_measurement_value(stream_id)
    Measurement
      .where(stream_id: stream_id)
      .reorder(time: :desc)
      .pluck(:value)
      .first
  end
end
