class AsyncMeasurementsCreator
  SLICE_SIZE = 500
  MEASUREMENTS_THRESHOLD = 6_000

  def initialize(
    measurements_creator_worker: MeasurementsCreatorWorker,
    stream_values_worker: StreamValuesWorker
  )
    @measurements_creator_worker = measurements_creator_worker
    @stream_values_worker = stream_values_worker
  end

  def call(stream:, measurements_attributes:)
    queue =
      measurements_attributes.size < MEASUREMENTS_THRESHOLD ? :default : :slow
    create_measurements_jobs(stream.id, measurements_attributes, queue)
    create_stream_values_job(stream.id, measurements_attributes, queue)
  end

  private

  def create_measurements_jobs(stream_id, measurements_attributes, queue)
    measurements_attributes.each_slice(SLICE_SIZE) do |attributes|
      @measurements_creator_worker
        .set(queue: queue)
        .perform_async(stream_id, attributes)
    end
  end

  def create_stream_values_job(stream_id, measurements_attributes, queue)
    @stream_values_worker
      .set(queue: queue)
      .perform_async(stream_id, measurements_attributes)
  end
end
