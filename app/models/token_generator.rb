class TokenGenerator
  def generate(length)
    (36**(length - 1) + rand(36**length - 36**(length - 1))).to_s(36)
  end

  def generate_unique(start_length)
    length = start_length
    token = nil

    while token.nil? || !yield(token)
      token = generate(length)
      length += 1
    end

    token
  end
end
