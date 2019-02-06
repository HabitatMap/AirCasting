class MeasurementsCreator
  SLICE_SIZE = 500
  AMOUNT_THRESHOLD = 20_000

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
    elsif measurements_attributes.size < AMOUNT_THRESHOLD
      create_several_async(stream.id, measurements_attributes)
    else
      create_many_async(stream.id, measurements_attributes)
    end
  end

  private

  def create_one_sync(stream, measurements_attributes)
    @sync_measurements_creator.call(stream, measurements_attributes)
  end

  def create_several_async(stream_id, measurements_attributes)
    create_multiple_async(stream_id, measurements_attributes, :several)
  end

  def create_many_async(stream_id, measurements_attributes)
    create_multiple_async(stream_id, measurements_attributes, :many)
  end

  def create_multiple_async(stream_id, measurements_attributes, amount)
    measurements_attributes.each_slice(SLICE_SIZE) do |attributes|
      @async_measurements_creator.perform_async(stream_id: stream_id, measurements_attributes: attributes, amount: amount)
    end
  end
end
