class ThresholdSetsRepository
  def find_by(sensor_name:, unit_symbol:)
    ThresholdSet.find_by(sensor_name: sensor_name, unit_symbol: unit_symbol)
  end

  def create!(params:)
    ThresholdSet.create!(params)
  end
end
