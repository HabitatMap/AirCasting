class StationMeasurementsSerializer
  def call(measurements)
    measurements.map do |measurement|
      { time: measurement.measured_at.to_i * 1_000, value: measurement.value }
    end
  end
end
