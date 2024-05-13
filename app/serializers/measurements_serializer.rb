class MeasurementsSerializer
  def call(measurements)
    measurements.map do |measurement|
      { time: measurement.time.to_i * 1_000, value: measurement.value }
    end
  end
end
