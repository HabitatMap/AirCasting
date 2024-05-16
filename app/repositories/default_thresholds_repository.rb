class DefaultThresholdsRepository
  def find_for(stream:)
    default_thresholds = DefaultThreshold.find_by(sensor_name: stream.sensor_name, unit_symbol: stream.unit_symbol)
    thresholds = default_thresholds ? default_thresholds : stream
  end
end
