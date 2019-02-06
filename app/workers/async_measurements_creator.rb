class AsyncMeasurementsCreator
  include Sidekiq::Worker

  def perform(stream_id:, measurements_attributes:, amount:)
    stream = streams_repository.find(stream_id)
    measurements_creator.call(stream, measurements_attributes, self.jid)
  end

  private

  def streams_repository
    @streams_repository ||= StreamsRepository.new
  end

  def measurements_creator
    @measurements_creator ||= SyncMeasurementsCreator.new
  end
end
