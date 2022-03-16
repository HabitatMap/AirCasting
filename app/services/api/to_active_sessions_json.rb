class Api::ToActiveSessionsJson
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?
    Success.new(ActiveRecord::Base.connection.execute(sql).to_a[0][0])
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

  def sql
    <<~SQL
      SELECT
        COALESCE(JSON_OBJECT(
          'sessions', JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', formatted_sessions.id,
              'title', formatted_sessions.title,
              'start_time_local', formatted_sessions.start_time_local,
              'end_time_local', formatted_sessions.end_time_local,
              'last_measurement_value', formatted_sessions.last_measurement_value,
              'is_indoor', formatted_sessions.is_indoor,
              'latitude', formatted_sessions.latitude,
              'longitude', formatted_sessions.longitude,
              'username', formatted_sessions.username,
              'streams', (
                SELECT
                  JSON_OBJECT(
                    streams.sensor_name,
                    JSON_OBJECT(
                      'sensor_name', streams.sensor_name,
                      'measurement_short_type', streams.measurement_short_type,
                      'unit_symbol', streams.unit_symbol,
                      'id', streams.id
                    )
                  )
                FROM
                  streams
                WHERE
                  streams.id = formatted_sessions.stream_id
              )
            )),
          'fetchableSessionsCount', (#{sessions.select('COUNT(DISTINCT sessions.id)').to_sql})
        ), JSON_OBJECT('sessions', JSON_ARRAY(), 'fetchableSessionsCount', 0))
      FROM
        (#{formatted_sessions.to_sql}) AS formatted_sessions
    SQL
  end

  def formatted_sessions
    sessions.select([
      'sessions.id',
      'sessions.title',
      'DATE_FORMAT(sessions.start_time_local, "%Y-%m-%dT%H:%i:%s.000Z") AS start_time_local',
      'DATE_FORMAT(sessions.end_time_local, "%Y-%m-%dT%H:%i:%s.000Z") AS end_time_local',
      '(SELECT streams.average_value WHERE streams.session_id = sessions.id) AS last_measurement_value',
      '(CASE WHEN sessions.is_indoor = 1 THEN cast(TRUE as json) ELSE cast(FALSE as json) END) AS is_indoor',
      'sessions.latitude',
      'sessions.longitude',
      'users.username',
      'streams.id AS stream_id',
    ])
  end

  def sessions
    @sessions ||= FixedSession.active.filter_(data)
  end
end
