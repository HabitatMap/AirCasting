class Regression < ActiveRecord::Base
  serialize :coefficients, Array
end
