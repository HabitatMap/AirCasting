require 'flipper/adapters/redis'

class Feature
  class << self
    def [](*args)
      flipper[*args]
    end

    def flipper
      @flipper ||= Flipper.new(adapter)
    end

    private

    def client
      @client ||= Redis.new
    end

    def adapter
      @adapter ||= Flipper::Adapters::Redis.new(client)
    end
  end
end
