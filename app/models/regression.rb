require_dependency 'regression_calculator'
class Regression < ActiveRecord::Base
  DEGREE = 4

  belongs_to :user
  serialize :coefficients, Array

  attr_accessor :is_owner

  def self.all_with_owner(user)
    all.map { |reg|
      reg.is_owner = (user.try(:id) == reg.user.try(:id))
      reg
    }
  end

  def self.build_for_streams(target, reference, degree = DEGREE, calculator = RegressionCalculator)
    coeffs = calculator.new(target.measurements, reference.measurements).run(degree)
    fields = %w(measurement_type measurement_short_type unit_name unit_symbol threshold_very_low threshold_low
       threshold_medium threshold_high threshold_very_high).inject({}) { |acc, method|
      acc.merge({method => reference.send(method)})
    }
    fields.merge!(reference_sensor_name: reference.sensor_name, reference_sensor_package_name: reference.sensor_package_name,
                  sensor_name: target.sensor_name, sensor_package_name: target.sensor_package_name, coefficients: coeffs)
    new(fields)
  end

  def self.create_for_streams(target, reference, user, degree = DEGREE, calculator = RegressionCalculator)
    where(sensor_name: target.sensor_name, sensor_package_name: target.sensor_package_name).destroy_all
    reg = build_for_streams(target, reference, degree, calculator)
    reg.user = user
    reg.save
    reg
  end
end
