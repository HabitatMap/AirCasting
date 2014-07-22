require_dependency 'regression_calculator'
class Regression < ActiveRecord::Base
  DEGREE = 10

  serialize :coefficients, Array

  def self.build_for_streams(target, reference, degree = DEGREE, calculator = RegressionCalculator)
    coeffs = calculator.new(target.measurements, reference.measurements).run(degree)
    fields = %w(measurement_type measurement_short_type unit_name unit_symbol threshold_very_low threshold_low
       threshold_medium threshold_high threshold_very_high).inject({}) { |acc, method|
      acc.merge({method => reference.send(method)})
    }
    fields.merge!(sensor_name: target.sensor_name, sensor_package_name: target.sensor_package_name, coefficients: coeffs)
    new(fields)
  end

  def self.create_for_streams(target, reference, degree = DEGREE, calculator = RegressionCalculator)
    reg = build_for_streams(target, reference, degree, calculator)
    reg.save
    reg
  end
end
