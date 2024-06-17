class Api::ToActiveSessionsArray
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    Success.new(
      sessions:
        FixedSession
          .active
          .with_user_and_streams
          .filter_(data)
          .map do |session|
            {
              id: session.id,
              uuid: session.uuid,
              title: session.title,
              start_time_local: session.start_time_local,
              end_time_local: session.end_time_local,
              last_hour_average: last_hour_average(session),
              is_indoor: session.is_indoor,
              latitude: session.latitude,
              longitude: session.longitude,
              type: session.type,
              username: session.is_indoor ? 'anonymous' : session.user.username,
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
                        threshold_high: stream.threshold_set.threshold_high,
                        threshold_low: stream.threshold_set.threshold_low,
                        threshold_medium: stream.threshold_set.threshold_medium,
                        threshold_very_high: stream.threshold_set.threshold_very_high,
                        threshold_very_low: stream.threshold_set.threshold_very_low,
                        unit_name: stream.unit_name,
                        unit_symbol: stream.unit_symbol
                      }
                    )
                  end
            }
          end,
      fetchableSessionsCount:
        FixedSession.active.filter_(data).distinct.count(:all)
    )
  end

  private

  attr_reader :form

  def last_hour_average(session)
    stream = session.streams.length >= 1 ? session.streams.first : nil
    return unless stream
    last_measurement_time = stream.measurements.last.time
    stream.measurements
      .where(time: last_measurement_time - 1.hour..last_measurement_time)
      .average(:value)
  end

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
end
