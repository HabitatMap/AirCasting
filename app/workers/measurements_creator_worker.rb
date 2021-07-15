class MeasurementsCreatorWorker
  include Sidekiq::Worker
  sidekiq_options queue: :default

  def perform(stream_id, measurements_attributes)
    stream = streams_repository.find(stream_id)
    measurements_creator.call(
      stream: stream,
      measurements_attributes: measurements_attributes
    )
  end

  private

  def streams_repository
    @streams_repository ||= StreamsRepository.new
  end

  def measurements_creator
    @measurements_creator ||= SyncMeasurementsCreator.new
  end
end
