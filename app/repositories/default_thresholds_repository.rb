class DefaultThresholdsRepository
  def stream_thresholds(stream:)
    DefaultThreshold.find_by(sensor_name: stream.sensor_name, unit_symbol: stream.unit_symbol)
  end
end
