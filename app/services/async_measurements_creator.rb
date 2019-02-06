class AsyncMeasurementsCreator
  SLICE_SIZE = 500
  AMOUNT_THRESHOLD = 20_000

  def initialize(measurements_creator_worker: MeasurementsCreatorWorker)
    @measurements_creator_worker = measurements_creator_worker
  end

  def call(stream:, measurements_attributes:)
    queue = measurements_attributes.size < AMOUNT_THRESHOLD ? :default : :slow
    create(stream.id, measurements_attributes, queue)
  end

  private

  def create(stream_id, measurements_attributes, queue)
    measurements_attributes.each_slice(SLICE_SIZE) do |attributes|
      @measurements_creator_worker
        .set(queue: queue)
        .perform_async(stream_id, attributes)
    end
  end
end
