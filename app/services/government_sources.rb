module GovernmentSources
  module_function

  def to_float(value)
    Float(value, exception: false)
  end
end
