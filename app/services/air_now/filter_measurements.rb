class AirNow::FilterMeasurements
  def initialize(measurements)
    @measurements = measurements
  end

  def call
    measurements.select do |measurement|
      measurement[:parameter].in?(['PM2.5', 'O3', 'NO2', 'OZONE'])
    end
  end

  private

  attr_accessor :measurements
end
