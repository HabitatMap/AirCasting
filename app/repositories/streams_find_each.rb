class StreamsFindEach
  def initialize(streams: Stream.mobile)
    @streams = streams
  end

  def call
    @streams.find_each { |stream| yield stream }
  end
end
