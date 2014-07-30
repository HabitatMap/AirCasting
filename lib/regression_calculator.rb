require 'gsl'

class RegressionCalculator
  def initialize(target, ref)
    @xs = target.map { |meas| measurement_value(meas) }
    @ys = align_timestamps(target, ref).map(&:value)
  end

  def run(deg)
    xs = GSL::Vector[@xs]
    ys = GSL::Vector[@ys]
    GSL::MultiFit.polyfit(xs, ys, deg)[0].to_a
  end

  private

  def measurement_value(measurement)
    if measurement.measured_value
      measurement.measured_value
    else
      measurement.value
    end
  end

  def align_timestamps(target, ref)
    res = []
    i = 0
    target.each do |meas|
      i += 1 while i < ref.length - 1 && meas.time >= ref[i + 1].time
      res << ref[i]
    end
    res
  end
end
