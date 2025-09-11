class MeasurementsRepository
  def import(measurements:)
    Measurement.import(measurements)
  end
end
