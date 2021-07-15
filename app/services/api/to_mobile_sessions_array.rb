class Api::ToMobileSessionsArray
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    Success.new(
      sessions: to_mobile_sessions_array(filtered.offset(offset).limit(limit)),
      fetchableSessionsCount: filtered.count(:all)
    )
  end

  private

  attr_reader :form

  def filtered
    sessions =
      MobileSession
        .with_user_and_streams
        .order('sessions.start_time_local DESC')
        .where(contribute: true)
        .joins(:streams)
        .merge(Stream.in_rectangle(data))
        .where(streams: { sensor_name: data[:sensor_name] })
        .where(streams: { unit_symbol: data[:unit_symbol] })
        .where('streams.measurements_count > 0')

    sessions2 =
      Session.filter_by_time_range(sessions, data[:time_from], data[:time_to])

    tags = data[:tags].to_s.split(/[\s,]/)
    sessions2 = sessions2.tagged_with(tags, any: true) if tags.present?

    usernames = AirCasting::UsernameParam.split(data[:usernames])
    if usernames.present?
      sessions2 = sessions2.joins(:user).where(users: { username: usernames })
    end

    sessions2
  end

  def to_mobile_sessions_array(sessions)
    sessions.map do |session|
      {
        id: session.id,
        title: session.title,
        start_time_local: session.start_time_local,
        end_time_local: session.end_time_local,
        type: session.type,
        username: session.user.username,
        streams:
          session
            .streams
            .reduce({}) do |acc, stream|
              acc.merge(
                stream.sensor_name => {
                  average_value: stream.average_value,
                  id: stream.id,
                  max_latitude: stream.max_latitude,
                  max_longitude: stream.max_longitude,
                  measurement_short_type: stream.measurement_short_type,
                  measurement_type: stream.measurement_type,
                  measurements_count: stream.measurements_count,
                  min_latitude: stream.min_latitude,
                  min_longitude: stream.min_longitude,
                  sensor_name: stream.sensor_name,
                  sensor_package_name: stream.sensor_package_name,
                  session_id: stream.session_id,
                  size: stream.size,
                  start_latitude: stream.start_latitude,
                  start_longitude: stream.start_longitude,
                  threshold_high: stream.threshold_high,
                  threshold_low: stream.threshold_low,
                  threshold_medium: stream.threshold_medium,
                  threshold_very_high: stream.threshold_very_high,
                  threshold_very_low: stream.threshold_very_low,
                  unit_name: stream.unit_name,
                  unit_symbol: stream.unit_symbol
                }
              )
            end
      }
    end
  end

  def data
    # `Session.filter_` checks for the presence of `is_indoor`.
    # In this case, `is_indoor` is always `nil` therefore
    # `form.to_h[:is_indoor]` fails. For now, we can pass
    # a vanilla Ruby hash with `form.to_h.to_h`.
    form.to_h.to_h
  end

  def limit
    data[:limit]
  end

  def offset
    data[:offset]
  end
end
