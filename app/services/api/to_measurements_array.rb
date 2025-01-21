class Api::ToMeasurementsArray
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    Success.new(measurements.map { |m| to_hash(m) })
  end

  private

  attr_reader :form

  def measurements
    form.to_h[:start_time] != 0 && form.to_h[:end_time] != 0 ? page : all
  end

  def page
    start_time = Time.at(form.to_h[:start_time] / 1_000)
    end_time = Time.at(form.to_h[:end_time] / 1_000)

    Measurement
      .with_streams(form.to_h[:stream_ids].split(','))
      .where(time: start_time..end_time)
  end

  def all
    Measurement.with_streams(form.to_h[:stream_ids])
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
