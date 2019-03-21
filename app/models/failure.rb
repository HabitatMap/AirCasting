class Failure < Result
  def initialize(value)
    @value = value
  end

   def success?
    false
  end

   def failure?
    true
  end

   def value
    @value
  end
end
