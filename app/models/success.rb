class Success < Result
  def initialize(value)
    @value = value
  end

  def success?
    true
  end

  def failure?
    false
  end

  def value
    @value
  end
end
