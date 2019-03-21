class Result
  def success?
    raise NotImplementedError
  end

   def failure?
    raise NotImplementedError
  end

   def value
    raise NotImplementedError
  end
end
