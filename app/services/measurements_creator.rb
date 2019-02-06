class MeasurementsCreator
  SLICE_SIZE = 500

  def initialize(
    sync_measurements_creator: SyncMeasurementsCreator.new,
    async_measurements_creator: AsyncMeasurementsCreator
  )
    @sync_measurements_creator = sync_measurements_creator
    @async_measurements_creator = async_measurements_creator
  end

  def call(stream, measurements_attributes)
    if measurements_attributes.one?
      create_one_sync(stream, measurements_attributes)
    else
      create_multiple_async(stream.id, measurements_attributes)
    end
  end

  private

  def create_one_sync(stream, measurements_attributes)
    @sync_measurements_creator.call(stream, measurements_attributes)
  end

  def create_multiple_async(stream_id, measurements_attributes)
    measurements_attributes.each_slice(SLICE_SIZE) do |attributes|
      @async_measurements_creator.perform_async(stream_id: stream_id, measurements_attributes: attributes)
    end
  end
end
