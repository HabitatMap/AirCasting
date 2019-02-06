class AsyncMeasurementsCreator
  SLICE_SIZE = 500
  AMOUNT_THRESHOLD = 20_000

  def initialize(measurements_creator_worker: MeasurementsCreatorWorker)
    @measurements_creator_worker = measurements_creator_worker
  end

  def call(stream:, measurements_attributes:)
    if measurements_attributes.size < AMOUNT_THRESHOLD
      create_multiple_async(stream.id, measurements_attributes, :default)
    else
      create_multiple_async(stream.id, measurements_attributes, :slow)
    end
  end

  private

  def create_multiple_async(stream_id, measurements_attributes, queue)
    measurements_attributes.each_slice(SLICE_SIZE) do |attributes|
      @measurements_creator_worker
        .set(queue: queue)
        .perform_async(stream_id: stream_id, measurements_attributes: attributes)
    end
  end
end
