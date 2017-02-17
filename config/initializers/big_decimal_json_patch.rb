require 'bigdecimal'

class BigDecimal
  def as_json(options = nil)
    if finite?
      self
    else
      NilClass::AS_JSON
    end
  end
end
