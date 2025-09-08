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
end
