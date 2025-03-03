class Api::ToMeasurementsArray
  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    Success.new(measurements.map { |m| to_hash(m) })
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end

  def measurements
    data.key?(:start_time) && data.key?(:end_time) ? page : all
  end

  def page
    start_time = Time.at(data[:start_time] / 1_000)
    end_time = Time.at(data[:end_time] / 1_000)

    Measurement
      .with_streams(data[:stream_ids].split(','))
      .where(time: start_time..end_time)
  end

  def all
    Measurement.with_streams(data[:stream_ids])
  end

  def to_hash(measurement)
    {
      time: measurement.time.to_i * 1_000,
      value: measurement.value,
      latitude: measurement.latitude,
      longitude: measurement.longitude,
    }
  end
end
