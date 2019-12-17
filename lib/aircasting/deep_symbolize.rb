module AirCasting
  module DeepSymbolize
    def deep_symbolize(obj)
      if obj.respond_to?(:symbolize_keys)
        data = obj.symbolize_keys.map { |k, v| [k, deep_symbolize(v)] }
        Hash[data]
      elsif obj.respond_to?(:map)
        obj.map { |x| deep_symbolize(x) }
      else
        obj
      end
    end
  end
end
