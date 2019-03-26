class Failure < Result
  def initialize(errors)
    @errors = errors
  end

  def success?
    false
  end

  def failure?
    true
  end

  def errors
    @errors
  end
end
