class StreamsWorker
  include Sidekiq::Worker

  def perform(measurements, id)
    Stream.transaction do
      stream = Stream.find(id)
      stream.build_measurements!(measurements)

      if stream.measurements.count > 0
        stream.calc_bounding_box! if stream.min_latitude.nil?
        stream.calc_average_value! if stream.average_value.nil?
      end
    end
  end

end
