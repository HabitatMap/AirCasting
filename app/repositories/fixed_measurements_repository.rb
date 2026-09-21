class FixedMeasurementsRepository
  def import(measurements:, on_duplicate_key_ignore:)
    FixedMeasurement.import(
      measurements,
      on_duplicate_key_ignore: on_duplicate_key_ignore,
    )
  end

  def last_2_days(stream_id:)
    FixedMeasurement
      .where(stream_id: stream_id)
      .where(
        "time_with_time_zone >= ((SELECT MAX(time_with_time_zone) FROM fixed_measurements WHERE stream_id = ?) - INTERVAL '2 days')",
        stream_id,
      )
  end

  def filter(stream_id:, start_time:, end_time:)
    FixedMeasurement
      .where(stream_id: stream_id)
      .where('time >= ?', start_time)
      .where('time <= ?', end_time)
  end

  # Newest reading per stream, in one query over
  # index_fixed_measurements_on_stream_id_and_time_with_time_zone. Streams that
  # have never reported are absent from the result rather than mapped to nil.
  def latest_by_stream_id(stream_ids:)
    return {} if stream_ids.empty?

    FixedMeasurement
      .select('DISTINCT ON (stream_id) stream_id, value, time_with_time_zone')
      .where(stream_id: stream_ids)
      .order(:stream_id, time_with_time_zone: :desc)
      .each_with_object({}) do |measurement, acc|
        acc[measurement.stream_id] = {
          value: measurement.value,
          time: measurement.time_with_time_zone,
        }
      end
  end
end
