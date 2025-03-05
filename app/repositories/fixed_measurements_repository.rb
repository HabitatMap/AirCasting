class FixedMeasurementsRepository
  def import(measurements:, on_duplicate_key_ignore:)
    FixedMeasurement.import(
      measurements,
      on_duplicate_key_ignore: on_duplicate_key_ignore,
    )
  end
end
