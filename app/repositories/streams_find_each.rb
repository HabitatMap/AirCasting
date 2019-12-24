class StreamsFindEach
  def initialize(streams: Stream.belong_to_mobile_sessions)
    @streams = streams
  end

  def call
    @streams.find_each { |stream| yield stream }
  end
end
