class AirNow::NormalizeMeasurements
  def initialize(measurements)
    @measurements = measurements
  end

  def call
    measurements.map do |measurement|
      measurement[:parameter] = 'O3' if measurement[:parameter] == 'OZONE'
      measurement
    end
  end

  private

  attr_accessor :measurements
end
