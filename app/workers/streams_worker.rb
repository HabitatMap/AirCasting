class StreamsWorker
  include Sidekiq::Worker

  def perform(measurements, id)
    stream = streams_repository.find(id)
    stream.build_measurements!(measurements)

    if stream.measurements.count > 0
      stream.calc_bounding_box!
      stream.calc_average_value!
      stream.after_measurements_created
    end
  end

  private

  def streams_repository
    @streams_repository ||= StreamsRepository.new
  end
end
