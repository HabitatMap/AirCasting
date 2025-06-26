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

    # used for testing purposes only
    def self.deflate(string)
      io = StringIO.new
      gz = Zlib::GzipWriter.new(io)
      gz.write(string)
      gz.close
      io.string
    end
  end
end
