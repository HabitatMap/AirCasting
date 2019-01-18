class MeasurementPresenter
  def self.collection(measurements)
    measurements.map { |measurement| new(measurement) }
  end

  def initialize(measurement)
    @measurement = measurement
  end

  attr_reader :measurement

  delegate :time, :value, :latitude, :longitude, to: :measurement

  def as_json
    {
      time: time.strftime("%FT%TZ"),
      value: value,
      latitude: latitude.to_f,
      longitude: longitude.to_f,
    }
  end
end
