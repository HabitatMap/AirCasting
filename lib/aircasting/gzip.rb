require 'zlib'

module AirCasting
  class GZip
    def self.inflate(string)
      io = StringIO.new(string)
      gz = Zlib::GzipReader.new(io)
      result = gz.read

      gz.close

      result
    end
  end
end
