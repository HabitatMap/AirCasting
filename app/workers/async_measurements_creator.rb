class AsyncMeasurementsCreator
  include Sidekiq::Worker

  def perform(stream_id, measurements_attributes)
    stream = streams_repository.find_by_id(stream_id)
    if stream
      measurements_creator.call(stream, measurements_attributes)
    end
  end

  private

  def streams_repository
    @streams_repository ||= StreamsRepository.new
  end

  def measurements_creator
    @measurements_creator ||= MeasurementsCreator.new
  end
end
